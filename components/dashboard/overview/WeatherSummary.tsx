"use client";

import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeatherSummary } from "@/hooks/useWeatherSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { Summary } from "lucide-react";

const TITLE_TRANSLATIONS: Record<string, string> = {
  en: "24-Hour Weather Summary",
  hi: "24-घंटे का मौसम सारांश",
  mr: "24-तासांचा हवामान सारांश",
  ta: "24-மணிநேர வானிலை சுருக்கம்",
  gu: "24-કલાક હવામાન સારાંશ",
};

export default function WeatherSummary() {
  const { language } = useLanguage();
  const { data: summary, isLoading, isError } = useWeatherSummary(language);

  // Show a skeleton loader while loading
  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-3.5 shadow-sm animate-pulse">
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-1/4 rounded-sm" />
          <Skeleton className="h-4 w-3/4 rounded-sm" />
        </div>
      </div>
    );
  }

  // If the API fails, hide the component instead of displaying an error
  if (isError || !summary) {
    return null;
  }

  const title = TITLE_TRANSLATIONS[language] || TITLE_TRANSLATIONS.en;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 pb-2 shadow-sm select-none">
      {/* SECTION SUBTITLE BAR */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
        <Summary className="size-4.5" />
        {title}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {summary}
        </p>
      </div>
    </div>
  );
}
