"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RiskChart from "@/components/ui/riskChart";
import { useRisk } from "@/hooks/useRisk";
import {
  CloudRainWind,
  Flame,
  Bug,
  Zap,
  Wind,
  Snowflake,
  AlertTriangle,
  TriangleAlert,
  Gauge,
} from "lucide-react";
import { useLocationContext } from "@/providers/LocationProvider";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

// Human-readable labels and Lucide icons for each hazard key — labels are resolved via t at render time
const HAZARD_ICONS: Record<string, React.ReactElement> = {
  heavy_rain: <CloudRainWind />,
  heat_stress: <Flame />,
  pest: <Bug />,
  lightning: <Zap />,
  wind: <Wind />,
  frost: <Snowflake />,
};

const HAZARD_KEYS = Object.keys(HAZARD_ICONS) as (keyof typeof HAZARD_ICONS)[];

// ------------------------------------------------------------------ skeleton

function RiskSkeleton() {
  return (
    <div className="w-full sm:p-4 bg-card border border-border rounded-xl p-5 pb-2 shadow-sm select-none">
      <div className="flex items-center justify-between mb-3.5">
        <Skeleton className="h-4 w-28 rounded-sm" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      {/* 2x3 on mobile, 1x6 on tablet/laptop, 2x3 on xl side-by-side, 1x6 on 2xl */}
      <div className="grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6 gap-2 sm:gap-3 w-full justify-items-center items-center my-auto">
        {HAZARD_KEYS.map((k) => (
          <div
            key={k}
            className="flex flex-col items-center gap-1.5 w-full max-w-[100px]"
          >
            <Skeleton className="w-full aspect-[100/56] rounded-t-full" />
            <Skeleton className="h-3 w-14 rounded-sm mt-1" />
            <Skeleton className="h-2.5 w-10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ main

export default function Risk() {
  const { location, isResolving } = useLocationContext();
  const { data, isLoading, isError } = useRisk();
  const { t } = useLanguage();

  if (isLoading || isResolving || !location) {
    return <RiskSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-3.5 shadow-sm flex items-center gap-2 text-muted-foreground text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
        <span>{t.dashboard?.agricultureRiskUnavailable || "Agricultural risk scores currently unavailable."}</span>
      </div>
    );
  }

  const overall = data.overall;

  return (
    <div className="w-full sm:p-4 shadow-sm bg-card border border-border rounded-xl p-5 pb-2 select-none">
      {/* Header row */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
        <Gauge className="size-4.5" />
        {t.dashboard?.agricultureRisk || "Agricultural Risk"}
        {overall && (
          <Badge
            variant={"default"}
            className="text-[10px] ml-auto rounded-sm"
            style={{
              background: overallBg(overall.score),
              color: overallFg(overall.score),
            }}
          >
            {t.dashboard?.overall || "Overall"}: {overall.band}
          </Badge>
        )}
      </div>
      {/* Grid:
          - Mobile (< 640px): 2x3 (grid-cols-3)
          - Stacked on tablet/laptop (640px - 1279px): 1x6 (sm:grid-cols-6)
          - Side-by-side on xl (1280px - 1535px): 2x3 (xl:grid-cols-3) to maintain readable chart size
          - Side-by-side on 2xl full screen (>= 1536px): 1x6 (2xl:grid-cols-6)
      */}
      <div className="grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6 gap-2 sm:gap-3 w-full justify-items-center items-center my-auto">
        {HAZARD_KEYS.map((key) => {
          const hazard = data[key as keyof typeof data] as
            | {
                score: number;
                band: string;
                major_factor: string;
                reasons: string[];
              }
            | undefined;

          if (!hazard) return null;

          const icon = HAZARD_ICONS[key];
          const label = key === "heavy_rain"
            ? (t.dashboard?.hazardHeavyRain || "Heavy Rain")
            : key === "heat_stress"
            ? (t.dashboard?.hazardHeatStress || "Heat Stress")
            : key === "pest"
            ? (t.dashboard?.hazardPest || "Pest & Disease")
            : key === "lightning"
            ? (t.dashboard?.hazardLightning || "Lightning")
            : key === "wind"
            ? (t.dashboard?.hazardWind || "Wind")
            : key === "frost"
            ? (t.dashboard?.hazardFrost || "Frost")
            : key;

          return (
            <RiskChart
              key={key}
              icon={icon}
              title={label}
              score={hazard.score}
              major_factor={hazard.major_factor}
              reasons={hazard.reasons}
            />
          );
        })}
      </div>

      {/* Overall summary sentence at bottom */}
      {/*{overall?.summary && (
        <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2.5">
          {overall.summary}
        </p>
      )}*/}
    </div>
  );
}

// ------------------------------------------------------------------ colour helpers for overall badge

function overallBg(score: number): string {
  if (score >= 80) return "rgba(229,62,62,0.15)";
  if (score >= 60) return "rgba(221,107,32,0.15)";
  if (score >= 40) return "rgba(214,158,46,0.15)";
  if (score >= 20) return "rgba(56,161,105,0.15)";
  return "rgba(113,128,150,0.12)";
}

function overallFg(score: number): string {
  if (score >= 80) return "#e53e3e";
  if (score >= 60) return "#dd6b20";
  if (score >= 40) return "#d69e2e";
  if (score >= 20) return "#38a169";
  return "#718096";
}
