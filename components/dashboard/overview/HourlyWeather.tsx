"use client";

import { Clock, CloudOff } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { type HourlySlot } from "@/types/weather";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Localized translations for the header
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSLATIONS: Record<string, any> = {
  en: {
    title: "Hourly Weather",
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
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="w-full min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 pb-0 select-none">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
        <Clock className="size-4.5" />
        {t.title}
        <Badge variant={"secondary"} className="text-[10px] ml-auto rounded-sm">
          {t.subtitle}
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
                  Something went wrong while fetching the Data. Please try again
                  later.
                </span>
              </div>
            ) : (
              <>
                {hourly.map((slot, i) => {
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
                      <Image
                        src={`/weatherIcons/${slot.icon.day}`}
                        alt={slot.condition.en}
                        width={26}
                        height={26}
                        className="my-0.5 drop-shadow-xs/40 dark:drop-shadow-none"
                      />

                      {/* 3. Temperature (Main metrics label) */}
                      <span className="text-md font-extrabold tracking-tight text-foreground">
                        {slot.temp}°C
                      </span>

                      {/* 4. Precipitation & Wind (Below Temperature) */}
                      <div className="flex flex-col items-center text-[12px] gap-2 text-muted-foreground font-medium leading-normal mt-0.5">
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HourlyWeather;

{
  /* 
        {isLoading ? (
          <>
            
          </>
        ) : (
          <>
          {!hourly ? (<></>) : (
            <>{hourly.map((slot, i) => {
              return (
                
              );
            })}
          </>)}
        )
       */
}
