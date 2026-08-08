"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { riskColor } from "@/components/ui/riskChart";
import { useRisk } from "@/hooks/useRisk";
import { useLanguage } from "@/hooks/useLanguage";
import { useForecast } from "@/hooks/useForecast";
import { useWeather } from "@/hooks/useWeather";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import {
  Bug,
  Thermometer,
  Droplets,
  CloudRain,
  Percent,
} from "lucide-react";

/**
 * "Pest & Disease" card for the Farm Risk page.
 * Reuses the existing pest hazard data (score, band, major_factor, reasons)
 * and the exact same inputs that drive the pest score:
 *   - 5-day average of the (bias-corrected) max temperature
 *   - current relative humidity
 *   - next-5-day rainfall / rainy days
 *   - latest historical soil moisture percentile
 *
 * All labels and the interpretation sentence are localized through the
 * constants/languages files. The CURRENT CONDITIONS values are derived
 * dynamically from live data — no hardcoded figures.
 */
const PestAndDisease = () => {
  const { data: riskData, isLoading: isRiskLoading } = useRisk();
  const { forecastRows, isLoading: isForecastLoading } = useForecast();
  const { data: weatherData, isLoading: isWeatherLoading } = useWeather();
  const { data: soilData, isLoading: isSoilLoading } = useSoilMoisture();
  const { t } = useLanguage();

  const hazard = riskData?.pest;
  const title = t.dashboard?.hazardPest || "Pest & Disease";

  // ---- same inputs the pest score is built from (see useRisk) ----
  const soilRows = soilData?.soil_moisture ?? [];
  const latestHistoricalRow = [...soilRows]
    .filter((r) => r.is_forecast === 0)
    .at(-1);
  const soilPercentile = latestHistoricalRow?.sm_percentile ?? null;

  const next5Rows = forecastRows.slice(0, 5);

  const rainNext5 =
    next5Rows.length > 0
      ? next5Rows.map((r) => r.pcp_corrected ?? r.pcp ?? 0)
      : weatherData?.daily?.precipitation_sum?.slice(0, 5) ?? null;

  const avgMaxTemp =
    next5Rows.length > 0
      ? next5Rows.reduce(
          (sum, r) => sum + (r.tmax_corrected ?? r.tmax ?? 0),
          0,
        ) / next5Rows.length
      : weatherData?.daily?.temperature_2m_max &&
        weatherData.daily.temperature_2m_max.length > 0
        ? weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) /
          weatherData.daily.temperature_2m_max.length
        : null;

  const humidity = weatherData?.current?.relative_humidity_2m ?? null;

  const rainTotal = rainNext5 ? rainNext5.reduce((a, b) => a + (b ?? 0), 0) : null;
  const rainyDays = rainNext5
    ? rainNext5.filter((v) => v != null && v >= 1).length
    : null;

  if (isRiskLoading || isWeatherLoading || isForecastLoading || isSoilLoading || !hazard) {
    return (
      <div className="w-full h-full min-h-55 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 select-none">
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Bug className="size-4.5 shrink-0 text-muted-foreground" />
            {title}
          </h3>
          <Skeleton className="h-3 w-36 rounded-sm" />
          <Skeleton className="h-3 w-44 rounded-sm" />
          <Skeleton className="h-3 w-40 rounded-sm" />
        </div>
      </div>
    );
  }

  const color = riskColor(hazard.score);

  // ---- dynamic factor description, derived from live values ----
  const pestFactorRainy =
    t.dashboard?.pestFactorRainyDays || "{n} rainy days in next 5 days";
  const factors: string[] = [];
  if (avgMaxTemp != null && avgMaxTemp >= 25 && avgMaxTemp <= 35) {
    factors.push(t.dashboard?.pestFactorWarm || "warm temperatures");
  }
  if (humidity != null && humidity >= 70) {
    factors.push(t.dashboard?.pestFactorHumidity || "high humidity");
  }
  if (rainyDays != null && rainyDays >= 1) {
    factors.push(pestFactorRainy.replace("{n}", String(rainyDays)));
  } else if (rainTotal != null && rainTotal >= 5) {
    factors.push(t.dashboard?.pestFactorFreshRain || "fresh rain expected");
  }
  if (soilPercentile != null && soilPercentile >= 70) {
    factors.push(t.dashboard?.pestFactorWetSoil || "prolonged soil wetness");
  }

  const factorsLabel = factors.join(", ");

  const interpKey =
    hazard.score >= 60
      ? factors.length > 0
        ? "pestInterpHigh"
        : "pestInterpHighNoFact"
      : hazard.score >= 40
        ? factors.length > 0
          ? "pestInterpModerate"
          : "pestInterpModerateNoFact"
        : factors.length > 0
          ? "pestInterpLow"
          : "pestInterpLowNoFact";

  const interpFallbacks: Record<
    | "pestInterpHigh"
    | "pestInterpHighNoFact"
    | "pestInterpModerate"
    | "pestInterpModerateNoFact"
    | "pestInterpLow"
    | "pestInterpLowNoFact",
    string
  > = {
    pestInterpHigh:
      "Current conditions ({factors}) are favourable for pest and disease build-up. Closely monitor the crop for early signs of pest activity or disease.",
    pestInterpHighNoFact:
      "Current conditions are favourable for pest and disease build-up. Closely monitor the crop for early signs of pest activity or disease.",
    pestInterpModerate:
      "Current conditions ({factors}) may support some pest and disease activity. Keep monitoring the crop regularly for early signs of an outbreak.",
    pestInterpModerateNoFact:
      "Current conditions may support some pest and disease activity. Keep monitoring the crop regularly for early signs of an outbreak.",
    pestInterpLow:
      "Current conditions ({factors}) are less favourable for a significant pest and disease build-up. Continue routine crop monitoring.",
    pestInterpLowNoFact:
      "Current conditions are less favourable for a significant pest and disease build. Continue routine crop monitoring.",
  };

  const interpretation = (t.dashboard?.[interpKey] || interpFallbacks[interpKey]).replace(
    "{factors}",
    factorsLabel,
  );

  const pill = (
    icon: React.ReactNode,
    label: string,
    value: string,
    sub?: string,
  ) => (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-2 min-w-0">
      <div className="flex items-center gap-1 text-muted-foreground uppercase tracking-wide text-[9px] font-bold">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground leading-none">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground leading-none">
          {sub}
        </div>
      )}
    </div>
  );

  const wetDaysLabel =
    rainyDays != null && rainyDays === 1
      ? t.dashboard?.pestWetDay || "wet day"
      : t.dashboard?.pestWetDays || "wet days";

  return (
    <div className="w-full h-full min-h-55 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 select-none flex flex-col">
      {/* Header row */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2 shrink-0">
        <Bug className="size-4.5 shrink-0" style={{ color }} />
        {title}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto"
          style={{ background: `${color}20`, color }}
        >
          {hazard.band}
        </span>
      </div>

      {/* Scrollable body — keeps the card from overflowing the page */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 -mr-1.5 space-y-2.5">
        {/* Major factor description */}
        {hazard.major_factor && (
          <p
            className="text-[12px] text-muted-foreground leading-relaxed italic border-l-2 pl-2"
            style={{ borderColor: color }}
          >
            {hazard.major_factor}
          </p>
        )}

        {/* Bullet list of reasons */}
        <ul className="space-y-1">
          {hazard.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[12px] text-foreground/90 leading-snug">
                {r}
              </span>
            </li>
          ))}
        </ul>

        {/* CURRENT CONDITIONS — live values feeding the pest score */}
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t.dashboard?.pestCurrentConditions || "Current Conditions"}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {pill(
              <Thermometer className="size-3" />,
              t.dashboard?.pestAvgMaxTemp || "Avg Max Temp",
              avgMaxTemp != null ? `${avgMaxTemp.toFixed(1)} °C` : "–",
              t.dashboard?.pestNext5Days || "next 5 days",
            )}
            {pill(
              <Droplets className="size-3" />,
              t.dashboard?.pestHumidity || "Humidity",
              humidity != null ? `${Math.round(humidity)}%` : "–",
              t.dashboard?.pestCurrent || "current",
            )}
            {pill(
              <CloudRain className="size-3" />,
              t.dashboard?.pestRain || "Rain · 5 days",
              rainTotal != null ? `${rainTotal.toFixed(1)} mm` : "–",
              rainyDays != null ? `${rainyDays} ${wetDaysLabel}` : undefined,
            )}
            {pill(
              <Percent className="size-3" />,
              t.dashboard?.pestSoilMoisture || "Soil Moisture",
              soilPercentile != null ? `${Math.round(soilPercentile)}%` : "–",
              t.dashboard?.pestPercentile || "percentile",
            )}
          </div>
        </section>

        {/* Interpretation — built from the live values and risk band */}
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t.dashboard?.pestInterpretation || "Interpretation"}
          </h4>
          <p
            className="text-[12px] text-foreground/90 leading-relaxed border-l-2 pl-2"
            style={{ borderColor: color }}
          >
            {interpretation}
          </p>
        </section>
      </div>
    </div>
  );
};

export default PestAndDisease;