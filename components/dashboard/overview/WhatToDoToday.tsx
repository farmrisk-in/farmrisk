"use client";

import React from "react";
import { ListChecks, Bug, Droplets, CloudRain, LoaderCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useWhatToDo } from "@/hooks/useWhatToDo";
import { useLocationContext } from "@/providers/LocationProvider";
import { type WhatToDoCategory, type WhatToDoRecommendation } from "@/lib/api/whatToDo";

/** Small icon per recommendation category (stable, never parsed from text). */
function categoryIcon(category: WhatToDoCategory) {
  switch (category) {
    case "pest":
      return Bug;
    case "irrigation":
      return Droplets;
    case "weather":
      return CloudRain;
    default:
      return ListChecks;
  }
}

/** Accent colour per category (hex so the alpha-suffix tint pattern works). */
function categoryColor(category: WhatToDoCategory) {
  switch (category) {
    case "pest":
      return "#10b981"; // emerald-500 — matches Pest & Disease card
    case "irrigation":
      return "#0ea5e9"; // sky-500 — matches Soil Moisture card
    case "weather":
      return "#f59e0b"; // amber-500
    default:
      return "#10b981";
  }
}

/**
 * "What To Do Today" — compact, at most TWO recommendation rows.
 *
 * Data comes from the backend aggregation endpoint (best Pest & Disease action
 * + best Irrigation recommendation, weather as fallback). All severity and
 * selection is decided deterministically by the backend.
 */
export default function WhatToDoToday() {
  const { language, t } = useLanguage();
  const { selectedCrop } = useSelectedCrop();
  const { location } = useLocationContext();
  const {
    data,
    recommendations,
    isLoading,
    isFetching,
    isError,
  } = useWhatToDo(selectedCrop.id, language);

  // While fetching for a different crop (crop/field switch) the previous crop's
  // recommendations would linger via keepPreviousData — show the loader instead.
  const isStaleCrop = isFetching && !!data && data.crop_id !== selectedCrop.id;

  // Same for a language switch: the previous language's text lingers via
  // keepPreviousData until the retranslation lands — show the loader instead.
  const isStaleLanguage = isFetching && !!data && data.language !== language;

  // No location chosen yet — never show a spinner without coordinates.
  const noLocation = !location || !location.lat || !location.lng;

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-border mb-3 pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ListChecks className="size-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
          {t.dashboard.whatToDoToday}
        </h3>
      </div>

      {/* LOADING */}
      {!noLocation && (isLoading || isStaleCrop || isStaleLanguage) && (
        <div className="flex flex-col items-center justify-center gap-3 min-h-28 py-4 text-muted-foreground">
          <LoaderCircle className="size-7 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">{t.dashboard.generatingOverview}</p>
        </div>
      )}

      {/* ERROR */}
      {!noLocation && !isLoading && !isStaleCrop && !isStaleLanguage && isError && (
        <div className="py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.dashboard.advisoryError}
          </p>
        </div>
      )}

      {/* RECOMMENDATIONS (max two rows) */}
      {!noLocation && !isLoading && !isStaleCrop && !isStaleLanguage && !isError && recommendations.length > 0 && (
        <ul className="flex flex-col divide-y divide-border/60">
          {recommendations.map((rec: WhatToDoRecommendation, i) => {
            const Icon = categoryIcon(rec.category);
            const color = categoryColor(rec.category);
            return (
              <li key={i} className="flex items-start gap-2.5 py-2.5">
                <span
                  className="mt-0.5 w-7 h-7 rounded-md shrink-0 flex items-center justify-center border"
                  style={{
                    color,
                    borderColor: `${color}35`,
                    background: `${color}10`,
                  }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-foreground/95 leading-snug block">
                    {rec.title}
                  </span>
                  {rec.hint && (
                    <span className="text-xs text-muted-foreground leading-snug block">
                      {rec.hint}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}