"use client";

import { useState, useEffect } from "react";
import { useForecast } from "@/hooks/useForecast";
import { useLanguage } from "@/hooks/use-language";
import { Progress } from "@/components/ui/progress";
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

interface DayPrediction {
  date: string;
  raw: { tmax: number; tmin: number; pcp: number };
  corrected: { tmax: number; tmin: number; pcp: number };
}

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

  const { data: predictions = [], isLoading } = useForecast(16);
  const [progressVal, setProgressVal] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // Reset to 0 when loading initiates
      setProgressVal(0);

      // 6500ms / 99 steps ≈ 65.6ms interval to hit 99% right at 6.5 seconds
      const intervalTime = 65;

      timer = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 99) {
            clearInterval(timer);
            return 99; // Stall at 99% indefinitely until loading turns false
          }
          return prev + 1;
        });
      }, intervalTime);
    } else {
      // When backend finishes, snap to 100 immediately
      setProgressVal(100);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  return (
    <div className={cn(
      "w-full bg-card border border-border rounded-xl p-5 pb-2 shadow-sm select-none",
      isPrintMode && "w-full p-0 border-none bg-transparent shadow-none"
    )}>
      {/* SECTION SUBTITLE BAR */}
      <div className={cn(
        "flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2",
        isPrintMode && "border-none text-slate-500 text-[10px] tracking-wider mb-1.5"
      )}>
        <TrendingUpDown className={cn("size-4.5", isPrintMode && "size-3.5 text-emerald-600")} />
        {t.dashboard.forecast16Day}
        {!isPrintMode && (
          <Badge variant={"default"} className="text-[10px] ml-auto rounded-sm">
            <CheckCheck size={15} className="mr-1" />
            Bias Corrected
          </Badge>
        )}
      </div>

      {predictions.length === 0 && !isLoading ? (
        <div className="w-full h-25 flex items-center justify-center gap-2 text-muted-foreground select-none">
          <CloudOff className="size-6" />
          <span className="text-sm font-medium">
            Something went wrong while fetching the forecast. Please try again
            later.
          </span>
        </div>
      ) : null}

      {progressVal < 100 && !isPrintMode ? (
        <div className="w-full h-30 flex items-center justify-center gap-2 text-muted-foreground select-none">
          <div className="w-full md:max-w-[80%] space-y-3">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="progress"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <LoaderCircle className="w-4 h-4 animate-spin text-emerald-500" />
                {progressVal === 100
                  ? "Analytics ready!"
                  : "Compiling bias-corrected analytics..."}
              </Label>
              <span className="text-muted-foreground font-mono text-sm tracking-tighter">
                {progressVal}%
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
        <div className={cn(
          "w-full flex overflow-x-auto pb-2 custom-scrollbar snap-x scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
          isPrintMode && "overflow-x-visible pb-0 justify-between border border-slate-200/85 rounded-lg p-2.5 bg-white"
        )}>
          {predictions.map((day, idx) => {
            // Extract the corrected variables from the model bundle payload
            const maxTemp = Math.round(day.corrected.tmax);
            const minTemp = Math.round(day.corrected.tmin);
            const rainVolume = day.corrected.pcp;

            return (
              <div
                key={day.date}
                className={cn(
                  `shrink-0 w-[77.4px] flex border-r last:border-0 flex-col items-center py-3 first:rounded-l-md last:rounded-r-md transition-all snap-start
                  ${idx === 0 ? "bg-emerald-500/5" : "hover:bg-muted/50"}`,
                  isPrintMode && `shrink-0 w-10.5 py-1.5 border-none last:border-none ${
                    idx === 0
                      ? "bg-emerald-500/10 border border-emerald-500/15"
                      : ""
                  }`
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
                <span className={cn(
                  "text-md font-extrabold text-orange-600 dark:text-orange-500 mt-1",
                  isPrintMode && "text-[10px] font-extrabold text-orange-600 mt-0.5"
                )}>
                  {maxTemp}°
                </span>

                {/* Height bar graphic */}
                <div className={cn(
                  "w-2 h-10 my-2 bg-linear-to-b from-orange-500 via-amber-400 to-sky-500 rounded-full opacity-80",
                  isPrintMode && "w-0.75 h-7 my-1 opacity-85"
                )} />

                {/* Tmin Layout Digit */}
                <span className={cn(
                  "text-md font-bold text-sky-600 dark:text-sky-400",
                  isPrintMode && "text-[9px] font-bold text-sky-600"
                )}>
                  {minTemp}°
                </span>

                {/* Total Precipitation Metrics Label */}
                <span className={cn(
                  "text-[12px] font-semibold text-muted-foreground font-mono mt-2",
                  isPrintMode && "text-[7.5px] font-semibold text-slate-400 mt-1"
                )}>
                  {rainVolume > 0 ? (isPrintMode ? `${rainVolume.toFixed(1)}` : `${rainVolume.toFixed(1)}mm`) : "—"}
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
