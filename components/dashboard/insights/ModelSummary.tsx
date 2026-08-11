"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUpDown, CheckCheck, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForecast } from "@/hooks/useForecast";
import { useWeather } from "@/hooks/useWeather";
import { useLanguage } from "@/hooks/useLanguage";
import { useAI } from "@/hooks/useAI";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { useIrrigation } from "@/hooks/useIrrigation";
import { TranslationType } from "@/constants/content";
import { ForecastRow } from "@/types/forecast";

const RAINY_DAY_THRESHOLD_MM = 2.5;

const formatDateText = (dateStr: string, locale: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
};

type SoilWordKey =
  | "smExceptionalWet"
  | "smExtremeWet"
  | "smSevereWet"
  | "smModerateWet"
  | "smAbnormallyWet"
  | "smNormal"
  | "smAbnormallyDry"
  | "smModerateDry"
  | "smExtremeDry"
  | "smSevereDry"
  | "smExceptionalDry";

// Matches backend "soil_word" band mapping (app/llm/advisory_engine.py:40)
const soilWord = (pct: number): SoilWordKey => {
  if (pct > 98) return "smExceptionalWet";
  if (pct > 95) return "smExtremeWet";
  if (pct > 90) return "smSevereWet";
  if (pct > 80) return "smModerateWet";
  if (pct > 70) return "smAbnormallyWet";
  if (pct > 30) return "smNormal";
  if (pct > 20) return "smAbnormallyDry";
  if (pct > 10) return "smModerateDry";
  if (pct > 5) return "smExtremeDry";
  if (pct > 2) return "smSevereDry";
  return "smExceptionalDry";
};

type OutlookKey = "outlookFavorable" | "outlookCautionary" | "outlookUnfavorable";

const extractOutlook = (text?: string): OutlookKey | "" => {
  if (!text) return "";

  const outlookMatch = text.match(
    /agricultural\s+outlook\s+for this period is\s+\*?(favorable|cautionary|unfavorable)\*?/i,
  );
  if (!outlookMatch) return "";
  const outlook = outlookMatch[1];
  return `outlook${outlook.charAt(0).toUpperCase()}${outlook.slice(1)}` as OutlookKey;
};

const soilWordText = (pct: number, t: TranslationType) =>
  t.dashboard[soilWord(pct)];

const useSelectedCropId = () => {
  const [cropId, setCropId] = useState<string>(() => {
    if (typeof window === "undefined") return "general";
    try {
      const stored = localStorage.getItem("farmrisk-selected-crop");
      return stored ? JSON.parse(stored).id : "general";
    } catch {
      return "general";
    }
  });

  useEffect(() => {
    const handleCropChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id) setCropId(detail.id);
    };
    window.addEventListener("farmrisk-crop-changed", handleCropChange);
    return () =>
      window.removeEventListener("farmrisk-crop-changed", handleCropChange);
  }, []);

  return cropId;
};

type Row = [string, string, string, string];

const ModelSummary = () => {
  const { t } = useLanguage();

  const { data: report, isLoading: isForecastLoading } = useForecast();
  const predictions = report?.forecast || [];

  const { data: weatherData } = useWeather();
  const daily = weatherData?.daily;

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

  const cropId = useSelectedCropId();
  const {
    data: advisory,
    isLoading: isAdvisoryLoading,
    isError: isAdvisoryError,
  } = useAI(cropId, "en");
  const outlook = extractOutlook(advisory);
  const outlookLabel = outlook ? t.dashboard[outlook] : "";
  const advisoryPending =
    isAdvisoryLoading && !advisory && !isAdvisoryError;

  // Same soil-moisture forecast source useAI already fetches (identical hook
  // signature shares its react-query cache, so no duplicate network call).
  const daysBefore = useIrrigation();
  const { data: soilResponse, isLoading: isSoilLoading } =
    useSoilMoisture(daysBefore);

  const soilTrend = useMemo(() => {
    const soilRows = soilResponse?.soil_moisture ?? [];
    const forecastDays = soilRows
      .filter((row) => row.is_forecast === 1)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (forecastDays.length === 0) return "";
    const startPct = forecastDays[0].sm_percentile;
    const endPct = forecastDays[forecastDays.length - 1].sm_percentile;
    if (startPct == null || endPct == null) return "";
    const startWord = soilWordText(startPct, t);
    const endWord = soilWordText(endPct, t);
    return startWord === endWord ? startWord : `${startWord} → ${endWord}`;
  }, [soilResponse, t]);
  const soilPending = isSoilLoading && !soilTrend;

  const metrics = useMemo(() => {
    if (finalPredictions.length === 0) return null;
    const totalRainfall = finalPredictions.reduce(
      (sum, day) => sum + (day.pcp_corrected ?? 0),
      0,
    );
    const rainyDays = finalPredictions.filter(
      (day) => (day.pcp_corrected ?? 0) >= RAINY_DAY_THRESHOLD_MM,
    ).length;

    let peak = finalPredictions[0];
    for (const day of finalPredictions) {
      if ((day.pcp_corrected ?? 0) > (peak.pcp_corrected ?? 0)) peak = day;
    }

    const maxTemp = Math.max(
      ...finalPredictions.map((day) => day.tmax_corrected),
    );
    const minTemp = Math.min(
      ...finalPredictions.map((day) => day.tmin_corrected),
    );

    return {
      totalRainfall,
      rainyDays,
      peakRain: peak.pcp_corrected ?? 0,
      peakDate: peak.date,
      maxTemp,
      minTemp,
    };
  }, [finalPredictions]);

  if (finalPredictions.length === 0 && !isForecastLoading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl shadow-sm select-none flex flex-col">
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider border-b border-border px-4 py-3">
          <TrendingUpDown className="size-4.5" />
          {t.dashboard.forecast16Day}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground">
          <CloudOff className="size-8 text-muted-foreground/60" />
          <span className="text-sm font-medium">
            {t.dashboard.modelSummaryLoadError}
          </span>
        </div>
      </div>
    );
  }

  if (isForecastLoading || !metrics) {
    return (
      <div className="w-full bg-card border border-border rounded-xl shadow-sm select-none">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="px-4 py-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-x-2 py-2.5 border-b border-border last:border-b-0">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows: Row[] = [
    [
      t.dashboard.totalRainfall,
      `${metrics.totalRainfall.toFixed(1)} mm`,
      t.dashboard.rainyDays,
      `${metrics.rainyDays} ${t.dashboard.daysUnit}`,
    ],
    [
      t.dashboard.peakDayRain,
      `${metrics.peakRain.toFixed(1)} mm`,
      t.dashboard.peakDate,
      formatDateText(metrics.peakDate, t.locale),
    ],
    [
      t.dashboard.maxTemp,
      `${Math.round(metrics.maxTemp)}°`,
      t.dashboard.minTemp,
      `${Math.round(metrics.minTemp)}°`,
    ],
    [
      t.dashboard.soilTrend,
      soilTrend || "—",
      t.dashboard.outlook,
      outlookLabel || "—",
    ],
  ];

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-sm select-none">
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider border-b border-border px-4 py-3">
        <TrendingUpDown className="size-4.5 text-primary" />
        {t.dashboard.forecast16Day}
        <span className="text-muted-foreground font-medium tracking-wide">
          · {t.dashboard.modelSummary}
        </span>
        {!isFallbackUsed && (
          <Badge variant={"default"} className="text-[10px] ml-auto rounded-sm">
            <CheckCheck size={15} className="mr-1" />
            {t.dashboard.biasCorrected}
          </Badge>
        )}
      </div>

      <div className="px-4 py-1.5">
        <div className="grid grid-cols-4 gap-x-4 py-2 [&>span]:font-semibold">
          <span>
            <div className="text-muted-foreground text-[11.5px] truncate">{t.dashboard.metric}</div>
          </span>
          <span className="min-w-0">
            <div className="text-muted-foreground text-[11.5px] truncate">{t.dashboard.value}</div>
          </span>
          <span className="min-w-0">
            <div className="text-muted-foreground text-[11.5px] truncate">{t.dashboard.metric}</div>
          </span>
          <span className="min-w-0">
            <div className="text-muted-foreground text-[11.5px] truncate">{t.dashboard.value}</div>
          </span>
        </div>

        {rows.map(([k1, v1, k2, v2], ri) => (
          <div
            key={ri}
            className="grid grid-cols-4 gap-x-4 py-2.5 border-t border-border"
          >
            <div className="min-w-0">
              <div className="text-muted-foreground text-[11.5px] truncate">{k1}</div>
            </div>
            <div className="min-w-0">
              {ri === 3 && soilPending ? (
                <Skeleton className="h-3.5 w-24" />
              ) : (
                <div className="text-[13.5px] font-semibold tabular-nums leading-tight">{v1}</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-muted-foreground text-[11.5px] truncate">{k2}</div>
            </div>
            <div className="min-w-0">
              {ri === 3 ? (
                <div className="text-[13.5px] font-semibold tabular-nums leading-tight">
                  {advisoryPending ? <Skeleton className="h-3.5 w-16" /> : v2}
                </div>
              ) : (
                <div className="text-[13.5px] font-semibold tabular-nums leading-tight">{v2}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSummary;