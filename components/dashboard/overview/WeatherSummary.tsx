"use client";

import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeatherSummary } from "@/hooks/useWeatherSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Summary } from "lucide-react";

export default function WeatherSummary() {
  const { language, t } = useLanguage();
  const {
    data: summary,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWeatherSummary(language);

  const title = t.dashboard.weatherSummary;

  const handleRetry = () => {
    refetch().catch(() => {
      // Ignore failures here; the fallback UI stays visible and react-query
      // records the error so the card keeps showing the fallback message.
    });
  };

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

  // If the summary is missing or the API failed, show a graceful fallback
  // instead of leaving the card blank.
  if (isError || !summary) {
    return (
      <div className="w-full bg-card border border-border text-foreground rounded-xl p-4 shadow-sm select-none flex flex-col">
        {/* SECTION SUBTITLE BAR */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
          <Summary className="size-4.5" />
          {title}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center min-h-36 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t.dashboard.weatherSummaryLoadError}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t.dashboard.weatherSummaryRetryHint}
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={handleRetry}
            className="mt-3"
          >
            {isFetching && <Loader2 className="size-4 animate-spin" />}
            {t.dashboard.weatherSummaryRetry}
          </Button>
        </div>
      </div>
    );
  }

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