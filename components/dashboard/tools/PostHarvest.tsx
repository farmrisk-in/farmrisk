"use client";

import React from "react";
import { CropSelector } from "@/components/dashboard/farmrisk/CropSelector";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { Store } from "lucide-react";
import MandiPrice from "./postharvest/MandiPrice";

/**
 * "Post-Harvest" Tool Page
 * Features post-harvest management and APMC mandi intelligence:
 * - Mandi price tracker for selected crop
 *
 * Kept empty by default with skeleton loading and error states.
 */
export function PostHarvest() {
  const { t } = useLanguage();
  const { selectedCrop } = useSelectedCrop();

  const title = t.tools?.postHarvest || "Post-Harvest";
  const desc =
    t.tools?.postHarvestDesc ||
    "Post-harvest market intelligence, APMC mandi arrivals, and commodity pricing for your crop.";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* CROP & LOCATION SELECTORS */}
      <CropSelector />
      <LocationSearchBar />

      {/* PAGE INTRO BANNER */}
      <div className="w-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
            <Store className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-background/80 border border-border text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          {selectedCrop.name}
        </div>
      </div>

      {/* POST-HARVEST TOOLS CONTENT */}
      <div className="w-full flex flex-col gap-4">
        <MandiPrice />
      </div>
    </div>
  );
}

export default PostHarvest;
