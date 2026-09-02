"use client";

import React, { useState } from "react";
import { CropSelector } from "@/components/dashboard/farmrisk/CropSelector";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useLocationContext } from "@/providers/LocationProvider";
import {
  Sprout,
  Sparkles,
  Layers,
  MapPin,
  BookOpen,
  LoaderCircle,
  ChevronDown,
  Calendar,
  Droplets,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CANONICAL_CROPS,
  INDIAN_STATES,
  SOIL_TYPE_OPTIONS,
  SEASON_OPTIONS,
  IRRIGATION_TYPE_OPTIONS,
  SoilType,
  Season,
  IrrigationType,
} from "@/lib/api/preSowing";
import { usePreSowing } from "@/hooks/usePreSowing";

import SowingTimeline from "./presowing/SowingTimeline";
import SeedSelection from "./presowing/SeedSelection";
import FieldPreparation from "./presowing/FieldPreparation";
import FertilizerPlan from "./presowing/FertilizerPlan";
import IrrigationSchedule from "./presowing/IrrigationSchedule";
import WeedManagement from "./presowing/WeedManagement";
import PestDiseaseCalendar from "./presowing/PestDiseaseCalendar";

/**
 * Helper to auto-detect Indian state from location display name
 */
function detectStateFromLocation(displayName?: string): string {
  if (!displayName) return "Gujarat";
  const lower = displayName.toLowerCase();
  for (const s of INDIAN_STATES) {
    if (lower.includes(s.toLowerCase())) {
      return s;
    }
  }
  return "Gujarat";
}

/**
 * Helper to match global selected crop name to canonical crop
 */
function matchCanonicalCrop(cropName?: string): string {
  if (!cropName || cropName.toLowerCase() === "general") return "Cotton";
  const lower = cropName.toLowerCase();
  const matched = CANONICAL_CROPS.find(
    (c) => c.toLowerCase() === lower || lower.includes(c.toLowerCase()),
  );
  return matched || "Cotton";
}

/**
 * "Pre-Sowing" Tool Page
 *
 * Connects directly to the RAG backend endpoint `POST /api/advisory/pre-sowing`.
 * Automatically reads:
 * - Crop: from the global CropSelector
 * - State: from the computed user location
 * - Language: from the global LanguageProvider
 *
 * Takes 3 field inputs:
 * 1. Soil Type
 * 2. Season
 * 3. Irrigation Type
 *
 * Distributes the 7 Markdown advisory sections to their dedicated widgets.
 */
export function PreSowing() {
  const { language, t } = useLanguage();
  const { selectedCrop } = useSelectedCrop();
  const { location } = useLocationContext();

  // Automatically derived global values
  const crop = matchCanonicalCrop(selectedCrop?.name);
  const state = detectStateFromLocation(location?.displayName);

  // Field input parameters
  const [soilType, setSoilType] = useState<SoilType>("black cotton soil");
  const [season, setSeason] = useState<Season>("Kharif");
  const [irrigationType, setIrrigationType] = useState<IrrigationType>("flood");

  // Pre-Sowing React Query Hook with language support
  const {
    data,
    sections,
    isLoading,
    isFetching,
    error,
    refetch,
  } = usePreSowing({
    crop,
    state,
    soil_type: soilType,
    season,
    irrigation_type: irrigationType,
    language,
  });

  const isGenerating = isLoading || isFetching;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* GLOBAL SELECTORS */}
      <CropSelector />
      <LocationSearchBar />

      {/* PARAMETERS CONFIGURATION PANEL */}
      <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        {/* PANEL HEADER WITH CONTEXT BADGES */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sprout className="size-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                {t.tools?.advisorySettings || "Pre-Sowing Parameters"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t.tools?.advisorySettingsDesc ||
                  "Configure soil, season, and irrigation properties to generate RAG-grounded ICAR guidelines."}
              </p>
            </div>
          </div>

          {/* ACTIVE CONTEXT & RAG SOURCES BADGES (TIME BADGE REMOVED) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Global Crop Context */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
              <Sprout className="size-3" />
              <span>{selectedCrop?.name || crop}</span>
            </div>

            {/* Computed State Context */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground border border-border text-[11px] font-semibold">
              <MapPin className="size-3 text-muted-foreground" />
              <span>{state}</span>
            </div>

            {/* Language Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border text-[11px] font-semibold uppercase">
              <Languages className="size-3" />
              <span>{language}</span>
            </div>

            {/* RAG Sources Metadata */}
            {data && !isGenerating && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <BookOpen className="size-3" />
                <span>
                  {data.rag_sources_used} {t.tools?.sourcesUsed || "sources used"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* INPUT DROPDOWNS FORM (SOIL TYPE, SEASON, IRRIGATION METHOD) */}
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. SOIL TYPE DROPDOWN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="presowing-soil"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Layers className="size-3.5 text-emerald-500" />
                <span>{t.tools?.selectSoilType || "Soil Type"}</span>
              </label>
              <div className="relative">
                <select
                  id="presowing-soil"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value as SoilType)}
                  disabled={isGenerating}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  {SOIL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            {/* 2. SEASON DROPDOWN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="presowing-season"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Calendar className="size-3.5 text-emerald-500" />
                <span>{t.tools?.selectSeason || "Season"}</span>
              </label>
              <div className="relative">
                <select
                  id="presowing-season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value as Season)}
                  disabled={isGenerating}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  {SEASON_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            {/* 3. IRRIGATION METHOD DROPDOWN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="presowing-irrigation"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Droplets className="size-3.5 text-emerald-500" />
                <span>{t.tools?.selectIrrigation || "Irrigation Method"}</span>
              </label>
              <div className="relative">
                <select
                  id="presowing-irrigation"
                  value={irrigationType}
                  onChange={(e) =>
                    setIrrigationType(e.target.value as IrrigationType)
                  }
                  disabled={isGenerating}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  {IRRIGATION_TYPE_OPTIONS.map((irr) => (
                    <option key={irr.value} value={irr.value}>
                      {irr.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9 px-4 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  <span>{t.tools?.generating || "Generating Advisory..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{t.tools?.generateAdvisory || "Generate Advisory"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 7 PRE-SOWING COMPONENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-stretch">
        {/* 1. Sowing Window / Timeline */}
        <div className="col-span-1 flex">
          <SowingTimeline
            content={sections?.sowing_window}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 2. Seed Selection */}
        <div className="col-span-1 flex">
          <SeedSelection
            content={sections?.seed_selection}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 3. Field Preparation */}
        <div className="col-span-1 flex">
          <FieldPreparation
            content={sections?.field_preparation}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 4. Fertilizer Plan */}
        <div className="col-span-1 flex">
          <FertilizerPlan
            content={sections?.fertilizer_plan}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 5. Irrigation Schedule */}
        <div className="col-span-1 flex">
          <IrrigationSchedule
            content={sections?.irrigation}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 6. Weed Management */}
        <div className="col-span-1 flex">
          <WeedManagement
            content={sections?.weed_management}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 7. Pest & Disease Calendar (Full width on large screens) */}
        <div className="col-span-1 lg:col-span-2 flex">
          <PestDiseaseCalendar
            content={sections?.pest_disease}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>
      </div>
    </div>
  );
}

export default PreSowing;
