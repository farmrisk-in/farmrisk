"use client";

import { useEffect, useMemo, useState } from "react";
import { useForecast } from "@/hooks/useForecast";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { Progress } from "@/components/ui/progress";
import { ForecastRow } from "@/types/forecast";
import {
  LoaderCircle,
  TrendingUpDown,
  CheckCheck,
  CloudOff,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

type RainCategoryKey =
  | "very_light"
  | "light"
  | "moderate"
  | "heavy"
  | "very_heavy"
  | "extremely_heavy";

interface HighlightBlock {
  start: number;
  end: number;
  category: Exclude<RainCategoryKey, "very_light">;
  totalRain: number;
  maxPcp: number;
}

const isValidRain = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const rainCategoryKey = (pcp: number): RainCategoryKey => {
  if (pcp >= 204.5) return "extremely_heavy";
  if (pcp >= 115.6) return "very_heavy";
  if (pcp >= 64.5) return "heavy";
  if (pcp >= 15.6) return "moderate";
  if (pcp >= 2.5) return "light";
  return "very_light";
};

const RAIN_HIGHLIGHT: Record<
  Exclude<RainCategoryKey, "very_light">,
  { bg: string; hover: string; text: string }
> = {
  light: {
    bg: "bg-emerald-500/10",
    hover: "hover:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  moderate: {
    bg: "bg-yellow-500/15",
    hover: "hover:bg-yellow-500/25",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  heavy: {
    bg: "bg-orange-500/15",
    hover: "hover:bg-orange-500/25",
    text: "text-orange-600 dark:text-orange-500",
  },
  very_heavy: {
    bg: "bg-red-500/15",
    hover: "hover:bg-red-500/25",
    text: "text-red-600 dark:text-red-500",
  },
  extremely_heavy: {
    bg: "bg-red-500/15",
    hover: "hover:bg-red-500/25",
    text: "text-red-600 dark:text-red-500",
  },
};

const CATEGORY_LABEL: Record<
  Exclude<RainCategoryKey, "very_light">,
  string
> = {
  light: "Light rain",
  moderate: "Moderate rain",
  heavy: "Heavy rain",
  very_heavy: "Very heavy rain",
  extremely_heavy: "Extremely heavy rain",
};

const findHighlightBlock = (days: ForecastRow[]): HighlightBlock | null => {
  let maxIdx = -1;
  let maxPcp = -Infinity;
  days.forEach((day, idx) => {
    const pcp = day?.pcp_corrected;
    if (isValidRain(pcp) && pcp > maxPcp) {
      maxPcp = pcp;
      maxIdx = idx;
    }
  });

  if (maxIdx === -1) return null;

  const category = rainCategoryKey(maxPcp);
  if (category === "very_light") return null;

  let start = maxIdx;
  while (start > 0) {
    const pcp = days[start - 1]?.pcp_corrected;
    if (!isValidRain(pcp) || rainCategoryKey(pcp) !== category) break;
    start -= 1;
  }

  let end = maxIdx;
  while (end < days.length - 1) {
    const pcp = days[end + 1]?.pcp_corrected;
    if (!isValidRain(pcp) || rainCategoryKey(pcp) !== category) break;
    end += 1;
  }

  let totalRain = 0;
  for (let i = start; i <= end; i += 1) {
    totalRain += days[i].pcp_corrected;
  }

  return { start, end, category, totalRain, maxPcp };
};

const Forcast = () => {
  const { t } = useLanguage();

  const { data: report, isLoading, isCorrectionFailed } = useForecast();
  const predictions = report?.forecast || [];
  const { data: weatherData } = useWeather();
  const daily = weatherData?.daily;

  const [progressVal, setProgressVal] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(true);

  // Map uncorrected forecast data as fallback
  const fallbackPredictions: ForecastRow[] = daily
    ? daily.time.map((time, idx) => ({
        date: new Date(time).toISOString().split("T")[0],
        tmax: daily.temperature_2m_max[idx],
        tmax_corrected: daily.temperature_2m_max[idx],
        tmin: daily.temperature_2m_min[idx],
        tmin_corrected: daily.temperature_2m_min[idx],
        pcp: daily.precipitation_sum[idx],
        pcp_corrected: daily.precipitation_sum[idx],
        is_forecast: 1 as const,
      }))
    : [];

  const finalPredictions =
    predictions.length > 0 ? predictions : fallbackPredictions;
  const isFallbackUsed =
    predictions.length === 0 && fallbackPredictions.length > 0;

  const highlight = useMemo(
    () => findHighlightBlock(finalPredictions),
    [finalPredictions],
  );

  const alertCategory = highlight
    ? RAIN_HIGHLIGHT[highlight.category]
    : null;

  const alertRange = highlight
    ? highlight.start === highlight.end
      ? `${formatDayName(finalPredictions[highlight.start].date)} ${formatDateText(finalPredictions[highlight.start].date)}`
      : `${formatDayName(finalPredictions[highlight.start].date)} ${formatDateText(finalPredictions[highlight.start].date)} – ${formatDayName(finalPredictions[highlight.end].date)} ${formatDateText(finalPredictions[highlight.end].date)}`
    : "";

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowProgressBar(true);
      setProgressVal(0);

      // Smoothly decelerate towards 99% over 5 seconds
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
    <div className="w-full bg-card border border-border rounded-xl p-5 pb-2 shadow-sm select-none">
      {/* SECTION SUBTITLE BAR */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
        <TrendingUpDown className="size-4.5" />
        {t.dashboard.forecast16Day}
        {!isFallbackUsed && (
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

      {showProgressBar ? (
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
        <>
          {/* HORIZONTAL SCROLL TIMELINE PANEL / GRID */}
          <div className="w-full flex overflow-x-auto pb-2 custom-scrollbar snap-x scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {finalPredictions.map((day, idx) => {
            const maxTemp = Math.round(day.tmax_corrected);
            const minTemp = Math.round(day.tmin_corrected);
            const rainVolume = day.pcp_corrected;

            const dayBg =
              highlight && idx >= highlight.start && idx <= highlight.end
                ? `${RAIN_HIGHLIGHT[highlight.category].bg} ${RAIN_HIGHLIGHT[highlight.category].hover}`
                : idx === 0
                  ? "bg-emerald-500/5"
                  : "hover:bg-muted/50";

            return (
              <div
                key={day.date}
                className={cn(
                  `shrink-0 w-[77.4px] flex border-r last:border-0 flex-col items-center py-3 first:rounded-l-md last:rounded-r-md transition-all snap-start
                  ${dayBg}`,
                )}
              >
                {/* Numeric Calendar Label */}
                <span className="text-xs text-muted-foreground font-medium mb-1">
                  {formatDateText(day.date)}
                </span>

                {/* Day Word Label */}
                <span className="text-md font-bold text-foreground mb-3">
                  {formatDayName(day.date)}
                </span>

                {/* Status Graphic Icon */}
                <Image
                  src={"/weatherIcons/" + getWeatherIcon(rainVolume)}
                  width={26}
                  height={26}
                  alt=""
                  className="my-0"
                />

                {/* Tmax Layout Digit */}
                <span className="text-md font-extrabold text-orange-600 dark:text-orange-500 mt-1">
                  {maxTemp}°
                </span>

                {/* Height bar graphic */}
                <div className="w-2 h-10 my-2 bg-linear-to-b from-orange-500 via-amber-400 to-sky-500 rounded-full opacity-80" />

                {/* Tmin Layout Digit */}
                <span className="text-md font-bold text-sky-600 dark:text-sky-400">
                  {minTemp}°
                </span>

                {/* Total Precipitation Metrics Label */}
                <span className="text-[12px] font-semibold text-muted-foreground font-mono mt-2">
                  {rainVolume > 0 ? `${rainVolume.toFixed(1)}mm` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {highlight && alertCategory && (
          <div className="border-t border-border pt-2.5 mt-1">
            <p className="flex items-start gap-2 text-xs sm:text-sm text-foreground leading-relaxed">
              <TriangleAlert
                className={`shrink-0 mt-0.5 size-4 ${alertCategory.text}`}
              />
              <span>
                <span
                  className={`font-semibold ${alertCategory.text}`}
                >
                  {CATEGORY_LABEL[highlight.category]}
                </span>
                {` alert: ${highlight.totalRain.toFixed(1)} mm expected ${alertRange}`}
              </span>
            </p>
          </div>
        )}
      </>
    )}
  </div>
);
};

export default Forcast;
