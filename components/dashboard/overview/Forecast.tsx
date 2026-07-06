"use client";

import { useState, useEffect } from "react";
import { useForecast } from "@/hooks/useForecast";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { Progress } from "@/components/ui/progress";
import { DailyForecastCorrection } from "@/types/forecast";
import {
  LoaderCircle,
  TrendingUpDown,
  CheckCheck,
  CloudOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ForcastProps {
  isPrintMode?: boolean;
}

// Helper to determine the right weather icon based on rain volume thresholds
const getWeatherIcon = (pcp: number) => {
  if (pcp > 5.0) return "heavy_rain.svg";
  if (pcp > 1.0) return "showers_rain.svg";
  if (pcp > 0.1) return "drizzle.svg";
  return "cloud.svg";
};

// Simple day name formatting helper
const formatDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

// Simple date text formatting helper
const formatDateText = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const Forcast = ({ isPrintMode }: ForcastProps) => {
  const { t } = useLanguage();

  const { data: report, isLoading } = useForecast();
  const predictions = report?.forecast?.forecast || [];
  const { data: weatherData } = useWeather();
  const daily = weatherData?.daily;

  const [progressVal, setProgressVal] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(true);

  // Map uncorrected forecast data as fallback
  const fallbackPredictions: DailyForecastCorrection[] = daily
    ? daily.time.map((time, idx) => ({
        date: new Date(time).toISOString().split("T")[0],
        tmax_raw: daily.temperature_2m_max[idx],
        tmax_corrected: daily.temperature_2m_max[idx],
        tmin_raw: daily.temperature_2m_min[idx],
        tmin_corrected: daily.temperature_2m_min[idx],
        pcp_raw: daily.precipitation_sum[idx],
        pcp_corrected: daily.precipitation_sum[idx],
      }))
    : [];

  const finalPredictions =
    predictions.length > 0 ? predictions : fallbackPredictions;
  const isFallbackUsed =
    predictions.length === 0 && fallbackPredictions.length > 0;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowProgressBar(true);
      setProgressVal(0);

      // Smoothly decelerate towards 99% over 10 seconds
      timer = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 99) {
            clearInterval(timer);
            return 99;
          }
          const diff = 99 - prev;
          const step = Math.max(0.05, diff * 0.045);
          return Math.min(99, prev + step);
        });
      }, 100);
    } else {
      // Rapidly complete to 100% in around 100ms
      timer = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setShowProgressBar(false);
            }, 200);
            return 100;
          }
          const step = Math.max(5, (100 - prev) * 0.4);
          return Math.min(100, prev + step);
        });
      }, 15);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  return (
    <div
      className={cn(
        "w-full bg-card border border-border rounded-xl p-5 pb-2 shadow-sm select-none",
        isPrintMode && "w-full p-0 border-none bg-transparent shadow-none",
      )}
    >
      {/* SECTION SUBTITLE BAR */}
      <div
        className={cn(
          "flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2",
          isPrintMode &&
            "border-none text-slate-500 text-[10px] tracking-wider mb-1.5",
        )}
      >
        <TrendingUpDown
          className={cn("size-4.5", isPrintMode && "size-3.5 text-emerald-600")}
        />
        {t.dashboard.forecast16Day}
        {!isPrintMode && !isFallbackUsed && (
          <Badge variant={"default"} className="text-[10px] ml-auto rounded-sm">
            <CheckCheck size={15} className="mr-1" />
            Bias Corrected
          </Badge>
        )}
      </div>

      {finalPredictions.length === 0 && !isLoading && !showProgressBar ? (
        <div className="w-full h-25 flex items-center justify-center gap-2 text-muted-foreground select-none">
          <CloudOff className="size-6" />
          <span className="text-sm font-medium">
            Something went wrong while fetching the forecast. Please try again
            later.
          </span>
        </div>
      ) : null}

      {showProgressBar && !isPrintMode ? (
        <div className="w-full h-30 flex items-center justify-center gap-2 text-muted-foreground select-none">
          <div className="w-full md:max-w-[80%] space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="progress"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <LoaderCircle className="w-4 h-4 animate-spin text-emerald-500" />
                {progressVal >= 100
                  ? "Analytics ready!"
                  : "Compiling bias-corrected analytics..."}
              </Label>
              <span className="text-muted-foreground font-mono text-sm tracking-tighter">
                {Math.round(progressVal)}%
              </span>
            </div>
            <Progress
              id="progress"
              value={progressVal}
              className="h-3 bg-emerald-500/20 transition-all duration-300 [&>div]:bg-emerald-500"
            />
          </div>
        </div>
      ) : (
        /* HORIZONTAL SCROLL TIMELINE PANEL / GRID */
        <div
          className={cn(
            "w-full flex overflow-x-auto pb-2 custom-scrollbar snap-x scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
            isPrintMode &&
              "overflow-x-visible pb-0 justify-between border border-slate-200/85 rounded-lg p-2.5 bg-white",
          )}
        >
          {finalPredictions.map((day, idx) => {
            const maxTemp = Math.round(day.tmax_corrected);
            const minTemp = Math.round(day.tmin_corrected);
            const rainVolume = day.pcp_corrected;

            return (
              <div
                key={day.date}
                className={cn(
                  `shrink-0 w-[77.4px] flex border-r last:border-0 flex-col items-center py-3 first:rounded-l-md last:rounded-r-md transition-all snap-start
                  ${idx === 0 ? "bg-emerald-500/5" : "hover:bg-muted/50"}`,
                  isPrintMode &&
                    `shrink-0 w-10.5 py-1.5 border-none last:border-none ${
                      idx === 0
                        ? "bg-emerald-500/10 border border-emerald-500/15"
                        : ""
                    }`,
                )}
              >
                {isPrintMode ? (
                  <>
                    <span className="text-[9px] font-bold text-slate-800">
                      {formatDayName(day.date)}
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-medium mb-1 font-sans">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        day: "numeric",
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    {/* Numeric Calendar Label */}
                    <span className="text-xs text-muted-foreground font-medium mb-1">
                      {formatDateText(day.date)}
                    </span>

                    {/* Day Word Label */}
                    <span className="text-md font-bold text-foreground mb-3">
                      {formatDayName(day.date)}
                    </span>
                  </>
                )}

                {/* Status Graphic Icon */}
                <Image
                  src={"/weatherIcons/" + getWeatherIcon(rainVolume)}
                  width={isPrintMode ? 16 : 26}
                  height={isPrintMode ? 16 : 26}
                  alt=""
                  className={cn(isPrintMode ? "my-0.5" : "my-0")}
                />

                {/* Tmax Layout Digit */}
                <span
                  className={cn(
                    "text-md font-extrabold text-orange-600 dark:text-orange-500 mt-1",
                    isPrintMode &&
                      "text-[10px] font-extrabold text-orange-600 mt-0.5",
                  )}
                >
                  {maxTemp}°
                </span>

                {/* Height bar graphic */}
                <div
                  className={cn(
                    "w-2 h-10 my-2 bg-linear-to-b from-orange-500 via-amber-400 to-sky-500 rounded-full opacity-80",
                    isPrintMode && "w-0.75 h-7 my-1 opacity-85",
                  )}
                />

                {/* Tmin Layout Digit */}
                <span
                  className={cn(
                    "text-md font-bold text-sky-600 dark:text-sky-400",
                    isPrintMode && "text-[9px] font-bold text-sky-600",
                  )}
                >
                  {minTemp}°
                </span>

                {/* Total Precipitation Metrics Label */}
                <span
                  className={cn(
                    "text-[12px] font-semibold text-muted-foreground font-mono mt-2",
                    isPrintMode &&
                      "text-[7.5px] font-semibold text-slate-400 mt-1",
                  )}
                >
                  {rainVolume > 0
                    ? isPrintMode
                      ? `${rainVolume.toFixed(1)}`
                      : `${rainVolume.toFixed(1)}mm`
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Forcast;
