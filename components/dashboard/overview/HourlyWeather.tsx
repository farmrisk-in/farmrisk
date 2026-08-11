"use client";

import {
  ArrowDown,
  ArrowUp,
  Clock,
  CloudOff,
  CloudRain,
  Thermometer,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeather } from "@/hooks/useWeather";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const formatHour = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const h = date.getUTCHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")} ${ampm}`;
};

function getConditionAlt(code: number, t: { dashboard: { clear: string; cloudy: string; conditionFoggy: string; conditionDrizzle: string; conditionRainy: string; conditionSnowy: string; showers: string; conditionSnowShowers: string; conditionThunderstorm: string } }): string {
  if (code === 0) return t.dashboard.clear;
  if (code <= 3) return t.dashboard.cloudy;
  if (code <= 48) return t.dashboard.conditionFoggy;
  if (code <= 55) return t.dashboard.conditionDrizzle;
  if (code <= 65) return t.dashboard.conditionRainy;
  if (code <= 77) return t.dashboard.conditionSnowy;
  if (code <= 82) return t.dashboard.showers;
  if (code <= 86) return t.dashboard.conditionSnowShowers;
  return t.dashboard.conditionThunderstorm;
}

type Trend = "up" | "down" | null;

function getTrend(current: number | undefined, next: number | undefined): Trend {
  if (current === undefined || next === undefined) return null;
  if (next > current) return "up";
  if (next < current) return "down";
  return null;
}

function TrendArrow({ trend, t }: { trend: Trend; t: { dashboard: { hourlyRising: string; hourlyFalling: string } } }) {
  if (!trend) return null;
  const up = trend === "up";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <Icon
      className={`size-3 ${up ? "text-orange-500" : "text-blue-500"}`}
      aria-label={up ? t.dashboard.hourlyRising : t.dashboard.hourlyFalling}
    />
  );
}

interface HourlyWeatherProps {
  /** When true, renders a compact grid of the next `hourCount` hours (for the Today page). */
  compact?: boolean;
  /** Number of upcoming hours to show in compact mode. */
  hourCount?: number;
}

const HourlyWeather = ({ compact = false, hourCount = 6 }: HourlyWeatherProps) => {
  const { t } = useLanguage();
  const db = t.dashboard;
  const { data, isLoading } = useWeather();
  const hourly = data?.hourly;

  const slots = hourly
    ? hourly.time.map((time, idx) => ({
        time: formatHour(time),
        temp: Math.round(hourly.temperature_2m[idx]),
        rainChance: hourly.precipitation_probability[idx] ?? 0,
        windKph: Math.round(hourly.wind_speed_10m[idx]),
        icon: hourly.icon[idx] || "clear_day.svg",
        weatherCode: hourly.weather_code[idx] ?? 0,
        rainfall: hourly.rain[idx] ?? 0,
      }))
    : [];

  if (compact) {
    const visible = slots.slice(0, hourCount);
    const current = data?.current;
    const first = visible[0];
    const last = visible[visible.length - 1];

    const summaryItems = [
      {
        key: "temperature",
        label: db.hourlyTemperature,
        value: `${Math.round(current?.temperature_2m ?? first?.temp ?? 0)}°C`,
        Icon: Thermometer,
        trend: getTrend(first?.temp, last?.temp),
      },
      {
        key: "rain",
        label: db.hourlyRainChance,
        value: `${first?.rainChance ?? 0}%`,
        Icon: CloudRain,
        trend: getTrend(first?.rainChance, last?.rainChance),
      },
      {
        key: "lightning",
        label: db.hourlyLightning,
        value: `${data?.lightning?.category ?? "Low"}`,
        Icon: Zap,
        trend: null,
      },
    ];

    return (
      <div className="w-full h-full min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-4 select-none flex flex-col gap-3">
        {/* HEADER */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
          <Clock className="size-4" />
          {db.hourlyNextHours}
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground uppercase">
            {db.hourlyNext6}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 min-[380px]:grid-cols-6 gap-2 items-stretch">
            {[...Array(hourCount).keys()].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 py-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : !hourly ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground select-none">
            <CloudOff className="size-6" />
            <span className="text-sm font-medium">
              {db.hourlyLoadError}
            </span>
          </div>
        ) : (
          <>
            {/* HOURLY TILES */}
            <div className="grid grid-cols-3 min-[380px]:grid-cols-6 gap-2">
              {visible.map((slot, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/40 py-2.5 px-1 text-center"
                >
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {slot.time}
                  </span>

                  {slot.icon ? (
                    <Image
                      src={`/weatherIcons/${slot.icon}`}
                          alt={getConditionAlt(slot.weatherCode, t)}
                      width={24}
                      height={24}
                      className="my-0.5 drop-shadow-xs/40 dark:drop-shadow-none"
                    />
                  ) : (
                    <CloudOff className="size-5 my-0.5 text-muted-foreground/60" />
                  )}

                  <span className="text-sm font-extrabold tracking-tight text-foreground">
                    {slot.temp}°C
                  </span>

                  <span className="text-[10px] font-semibold text-blue-500">
                    {slot.rainChance}%
                  </span>

                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {slot.windKph} km/h
                  </span>
                </div>
              ))}
            </div>

            {/* SUMMARY ROW */}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              {summaryItems.map(({ key, label, value, Icon, trend }) => (
                <div
                  key={key}
                  className="flex-1 flex items-center justify-center gap-2 min-w-0"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-foreground flex items-center gap-0.5">
                      {value}
                      <TrendArrow trend={trend} t={t} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 pb-0 select-none">
      {/* HEADER SECTION */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
          <Clock className="size-4.5" />
          {db.hourlyForecastTitle}
          <Badge variant={"secondary"} className="text-[10px] ml-auto rounded-sm">
            {db.hourlyNext24}
          </Badge>
        </div>

      <div className="flex gap-0 justify-start overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {isLoading ? (
          <>
            {[...Array(24).keys()].map((i) => (
              <div
                key={i}
                className="flex-none flex flex-col items-center gap-2 w-15 py-1"
              >
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </>
        ) : (
          <>
            {!hourly ? (
              <div className="w-full h-25 flex items-center justify-center gap-2 text-muted-foreground select-none">
                <CloudOff className="size-6" />
                <span className="text-sm font-medium">
                  {db.hourlyLoadError}
                </span>
              </div>
            ) : (
              <>
                {slots.map((slot, i) => {
                  return (
                    <div
                      key={i}
                      className="flex-none border-r last:border-0 flex flex-col items-center gap-2 min-w-15 py-1"
                    >
                      {/* 1. Time Label */}
                      <span className="text-[12px] text-muted-foreground font-semibold">
                        {slot.time}
                      </span>

                      {/* 2. Weather Icon (Above Temperature) */}
                      {slot.icon ? (
                        <Image
                          src={`/weatherIcons/${slot.icon}`}
                      alt={getConditionAlt(slot.weatherCode, t)}
                          width={26}
                          height={26}
                          className="my-0.5 drop-shadow-xs/40 dark:drop-shadow-none"
                        />
                      ) : (
                        <CloudOff className="size-6 my-0.5 text-muted-foreground/60" />
                      )}

                      {/* 3. Temperature (Main metrics label) */}
                      <span className="text-md font-extrabold tracking-tight text-foreground">
                        {slot.temp}°C
                      </span>

                      {/* 4. Precipitation & Wind (Below Temperature) */}
                      <div className="flex flex-col items-center text-[12px] gap-2 text-muted-foreground font-medium leading-normal">
                        <span className="text-blue-500 font-semibold">
                          {slot.rainChance}%
                        </span>
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          {slot.rainfall}
                          <span className="text-[11px]">mm</span>
                        </span>
                        <span className="truncate max-w-16.25 text-center">
                          {slot.windKph}
                          <span className="text-[11px]">kph</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HourlyWeather;
