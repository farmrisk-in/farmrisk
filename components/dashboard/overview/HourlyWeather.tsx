"use client";

import React from "react";
import {
  Clock,
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { type HourlySlot } from "@/hooks/use-weather";
import { Badge } from "@/components/ui/badge";

// Icon components mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
};

// Colors mapping for rich aesthetics
const ICON_COLORS: Record<string, string> = {
  Sun: "text-amber-500",
  CloudSun: "text-amber-500/80",
  Cloud: "text-slate-400",
  CloudDrizzle: "text-blue-400",
  CloudRain: "text-blue-500",
  CloudLightning: "text-purple-500",
  Snowflake: "text-sky-300",
  Wind: "text-teal-400",
};

// Localized translations for the header
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSLATIONS: Record<string, any> = {
  en: {
    title: "Hourly Timeline",
    subtitle: "Next 24 Hours",
  },
  hi: {
    title: "प्रति घंटा समयरेखा",
    subtitle: "अगले 24 घंटे",
  },
  mr: {
    title: "वेळापत्रक अंदाज",
    subtitle: "पुढील २४ तास",
  },
  ta: {
    title: "மணிநேர காலவரிசை",
    subtitle: "அடுத்த 24 மணிநேரம்",
  },
  gu: {
    title: "કલાકદીઠ ટાઈમલાઈન",
    subtitle: "આગામી 24 કલાક",
  },
};

interface HourlyWeatherProps {
  hourly: HourlySlot[] | undefined;
  isLoading: boolean;
}

const HourlyWeather = ({ hourly, isLoading }: HourlyWeatherProps) => {
  const { language } = useLanguage();
  const trans = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Loading skeleton rendering
  if (isLoading || !hourly) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm select-none">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-3 justify-start overflow-x-auto pb-1 scrollbar-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-3 pb-0 select-none flex flex-col gap-3">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-border pb-1 shrink-0">
        <div className="flex gap-2 p-1.5 rounded-lg text-primary shrink-0">
          <Clock className="size-4" />
          <h2 className="text-sm font-bold text-foreground leading-none">
            {trans.title}
          </h2>
        </div>
        <Badge variant={"secondary"}>{trans.subtitle}</Badge>
      </div>

      {/* HORIZONTAL DATA STRIP (Scrollable viewport) */}
      <div className="flex gap-0 justify-start lg:justify-between overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {hourly.map((slot, i) => {
          const ActiveIcon = ICON_MAP[slot.icon] || Sun;
          const iconColorClass = ICON_COLORS[slot.icon] || "text-primary";

          return (
            <div
              key={i}
              className="flex-none flex flex-col items-center gap-1 min-w-15 py-1"
            >
              {/* 1. Time Label */}
              <span className="text-[12px] text-muted-foreground font-semibold">
                {slot.time}
              </span>

              {/* 2. Weather Icon (Above Temperature) */}
              <div className={`${iconColorClass} my-0.5`}>
                <ActiveIcon className="size-5 stroke-[1.8]" />
              </div>

              {/* 3. Temperature (Main metrics label) */}
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-foreground">
                {slot.temp}°C
              </span>

              {/* 4. Precipitation & Wind (Below Temperature) */}
              <div className="flex flex-col items-center text-[11px] text-muted-foreground font-medium leading-normal mt-0.5">
                <span className="text-blue-500 font-semibold">
                  {slot.rainChance}%
                </span>
                <span className="truncate max-w-16.25 text-center font-mono">
                  {slot.windKph}kph
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HourlyWeather;
