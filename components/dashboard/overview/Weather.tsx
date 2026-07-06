"use client";

import {
  CloudSun,
  Wind,
  Gauge,
  Droplets,
  Cloud,
  CloudRain,
  Compass,
  CloudOff,
} from "lucide-react";
import { useLocationContext } from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useWeather } from "@/hooks/useWeather";
// Convert degrees to cardinal directions
function getWindDirection(deg: number): string {
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
}

const Weather = () => {
  const { language, t } = useLanguage();
  const { location } = useLocationContext();
  const { data, isLoading, isError, errorMessage } = useWeather();
  const current = data?.current;

  // Loading skeleton rendering
  if (isLoading) {
    return (
      <div className="@container w-full h-full min-h-fit bg-card border border-border rounded-xl p-5 flex flex-col justify-between select-none">
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between flex-1 mt-4">
          <div className="flex-1 min-w-32.5 space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full @[450px]:w-85 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error boundary rendering
  if (isError || !current) {
    return (
      <div className="w-full h-full min-h-55 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 flex flex-col items-center justify-center select-none text-center">
        <CloudOff className="size-12 text-muted-foreground/60 mb-2" />
        <h3 className="font-semibold text-sm">
          {t.dashboard.weatherLoadError}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-55">
          {errorMessage || t.dashboard.weatherLoadErrorDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="@container w-full h-full min-h-fit bg-card border border-border text-foreground rounded-xl shadow-sm p-5 flex flex-col justify-between select-none">
      {/* 1. MODULE SUBTITLE HEADER */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider mb-2">
        <CloudSun className="size-5" />
        {t.dashboard.currentClimate}
      </div>

      {/* 2. GEOLOCATION RUNTIME HEADER BANNER */}
      <div className="w-full flex items-start gap-2 border border-border border-x-0 py-2.5 mb-3 shrink-0">
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">
            {location.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate tracking-tight">
            {location.lat.toFixed(4)}°N · {location.lng.toFixed(4)}°E
          </p>
        </div>
      </div>

      {/* 3. CORE ADVISORY SEGMENT SPLIT LAYOUT (Using Flex Wrap & Container Queries) */}
      <div className="flex overflow-hidden flex-row flex-wrap gap-4 items-center justify-between flex-1 min-h-0">
        {/* LEFT COLUMN: THE EXECUTIVE TEMPERATURE HOOK */}
        <div className="flex flex-1 min-w-32.5 justify-between">
          <div className="flex flex-col items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tracking-tighter">
              {current.temperature_2m}°C
            </span>
            <p className="text-xs text-muted-foreground font-medium">
              Feels Like{" "}
              <span className="font-semibold text-foreground">
                {current.apparent_temperature}°C
              </span>
            </p>
          </div>
          <div className="flex flex-col justify-between items-center">
            <Image
              src={"/weatherIcons/" + current.icon}
              alt={JSON.stringify(current.icon)}
              width={40}
              height={40}
              className="drop-shadow-md dark:drop-shadow-none"
            />
            <span className="text-muted-foreground text-xs font-medium">
              {current.condition[language as keyof typeof current.condition] ||
                current.condition.en}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-DENSITY METRICS DOCK (2-Column Grid with responsive wrapping & border toggle) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t @[450px]:border-t-0 @[450px]:border-l border-border pt-3.5 @[450px]:pt-0 @[450px]:pl-4 w-full @[450px]:w-85 shrink-0 min-w-70">
          {/* Precipitation */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <CloudRain className="size-3.5 shrink-0 text-blue-400" />
              <span className="truncate">{t.dashboard.rainfall}</span>
            </div>
            <span className="font-semibold text-right shrink-0">
              {current.precipitation} mm
            </span>
          </div>

          {/* Wind Speed */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Wind className="size-3.5 shrink-0 text-sky-500" />
              <span className="truncate">{t.dashboard.wind}</span>
            </div>
            <span className="font-semibold text-right shrink-0 truncate max-w-20">
              {current.wind_speed_10m} km/h
            </span>
          </div>

          {/* Cloud Cover */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Cloud className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{t.dashboard.clouds}</span>
            </div>
            <span className="font-semibold text-right shrink-0">
              {current.cloud_cover}%
            </span>
          </div>

          {/* Humidity */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Droplets className="size-3.5 shrink-0 text-blue-500" />
              <span className="truncate">{t.dashboard.humidity}</span>
            </div>
            <span className="font-semibold text-right shrink-0">
              {current.relative_humidity_2m}%
            </span>
          </div>

          {/* Wind Gusts */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Wind className="size-3.5 shrink-0 opacity-40 text-sky-400" />
              <span className="truncate">{t.dashboard.gusts}</span>
            </div>
            <span className="font-medium text-right shrink-0 truncate max-w-20">
              {current.wind_gusts_10m} km/h
            </span>
          </div>

          {/* Wind Direction */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Compass className="size-3.5 shrink-0 text-amber-500" />
              <span className="truncate">{t.dashboard.direction}</span>
            </div>
            <span className="font-semibold text-right shrink-0 font-mono">
              {current.wind_direction_10m}°{" "}
              {getWindDirection(current.wind_direction_10m)}
            </span>
          </div>

          {/* Sea level pressure (MSL) */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Gauge className="size-3.5 shrink-0 text-purple-500" />
              <span className="truncate">{t.dashboard.pressureMsl}</span>
            </div>
            <span className="font-semibold text-right shrink-0 font-mono">
              {current.pressure_msl} hPa
            </span>
          </div>

          {/* Surface pressure */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <Gauge className="size-3.5 shrink-0 opacity-40 text-purple-400" />
              <span className="truncate">{t.dashboard.pressureSurf}</span>
            </div>
            <span className="font-semibold text-right shrink-0 font-mono">
              {current.surface_pressure} hPa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
