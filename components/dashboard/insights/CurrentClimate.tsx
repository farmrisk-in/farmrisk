"use client";

import { CloudSun, CloudOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";

const getWindDirection = (deg: number): string => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const val = Math.floor(deg / 22.5 + 0.5);
  return directions[val % 16];
};

type MetricPair = [string, string, string, string];

const CurrentClimate = () => {
  const { t } = useLanguage();
  const { data, isLoading, isError, errorMessage } = useWeather();
  const current = data?.current;

  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl shadow-sm select-none">
        <div className="px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="px-4 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-x-4 py-1.5 border-b border-border last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !current) {
    return (
      <div className="w-full bg-card border border-border text-foreground rounded-xl shadow-sm select-none flex flex-col">
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider border-b border-border px-4 py-3">
          <CloudSun className="size-4.5" />
          {t.dashboard.currentClimate}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-6">
          <CloudOff className="size-8 text-muted-foreground/60" />
          <h3 className="font-semibold text-sm">{t.dashboard.weatherLoadError}</h3>
          <p className="text-xs text-muted-foreground px-4">
            {errorMessage || t.dashboard.weatherLoadErrorDesc}
          </p>
        </div>
      </div>
    );
  }

  const rows: MetricPair[] = [
    [t.dashboard.temperature, `${current.temperature_2m}°C`, t.dashboard.feelsLike, `${current.apparent_temperature}°C`],
    [t.dashboard.clouds, `${current.cloud_cover}%`, t.dashboard.humidity, `${current.relative_humidity_2m}%`],
    [t.dashboard.wind, `${current.wind_speed_10m} km/h`, t.dashboard.direction, `${current.wind_direction_10m}° ${getWindDirection(current.wind_direction_10m)}`],
    [t.dashboard.gusts, `${current.wind_gusts_10m} km/h`, t.dashboard.rainfall, `${current.precipitation} mm`],
    [t.dashboard.pressureMsl, `${current.pressure_msl} hPa`, t.dashboard.pressureSurf, `${current.surface_pressure} hPa`],
  ];

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-sm select-none">
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider border-b border-border px-4 py-3">
        <CloudSun className="size-4.5 text-primary" />
        {t.dashboard.currentClimate}
        <span className="text-muted-foreground font-medium tracking-wide">· {t.dashboard.fullReadout}</span>
      </div>

      <div className="px-4 py-2">
        {rows.map(([k1, v1, k2, v2], ri) => (
          <div key={ri} className="grid grid-cols-2 gap-x-4 py-1.5 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-muted-foreground text-[11px] truncate shrink-0">{k1}</span>
              <span className="text-[13px] font-semibold text-right tabular-nums truncate">{v1}</span>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-muted-foreground text-[11px] truncate shrink-0">{k2}</span>
              <span className="text-[13px] font-semibold text-right tabular-nums truncate">{v2}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrentClimate;