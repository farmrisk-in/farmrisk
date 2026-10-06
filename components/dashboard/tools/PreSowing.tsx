"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CropSelector } from "@/components/dashboard/farmrisk/CropSelector";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useLocationContext } from "@/providers/LocationProvider";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
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
  Lock,
  Download,
} from "lucide-react";
import { FarmRiskLogo } from "@/components/ui/logo";
import { generatePreSowingPDF } from "@/lib/pdf/presowingPdf";
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
import { NearestKVKFooter } from "./NearestKVKFooter";

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
  return matched || cropName;
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  // Auto-detect soil type based on GPS coords
  const { data: detectedSoil, isLoading: isDetectingSoil } = useQuery({
    queryKey: ['soil-detect', location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return null;
      const res = await fetch(`/api/soil?lat=${location.lat}&lon=${location.lng}`);
      if (!res.ok) throw new Error('Soil detection failed');
      const data = await res.json();
      return data;
    },
    enabled: !!location,
    staleTime: Infinity,
  });

  // Automatically update the dropdown if we detect the soil successfully
  useEffect(() => {
    if (detectedSoil?.soil_type) {
      // Find matching SoilType enum value by matching string loosely
      const detected = detectedSoil.soil_type.toLowerCase();
      const match = SOIL_TYPE_OPTIONS.find(opt => 
        detected.includes(opt.value.toLowerCase()) || 
        opt.value.toLowerCase().includes(detected)
      );
      if (match) {
        setSoilType(match.value);
      }
    }
  }, [detectedSoil]);

  // Pre-Sowing React Query Hook with language support and auth gate
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
    enabled: false,
  });

  const isGenerating = isLoading || isFetching;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const hasAdvisoryData = Boolean(
    sections &&
      Object.values(sections).some(
        (val) => typeof val === "string" && val.trim().length > 0,
      ),
  );

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf || !hasAdvisoryData) return;
    setIsDownloadingPdf(true);
    try {
      await generatePreSowingPDF({
        elementId: "presowing-printable-area",
        cropName: selectedCrop?.name || crop,
        stateName: state,
      });
    } catch (err) {
      console.error("Failed to generate Pre-Sowing PDF", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none bg-card border border-border rounded-xl shadow-sm my-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/20">
          <Lock className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {t.tools?.preSowing || "Pre-Sowing Advisory"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-md leading-relaxed">
          Pre-Sowing agronomic decision support and ICAR guidelines are exclusive to registered accounts. Please sign in to access.
        </p>
        <Button
          onClick={() => router.push("/auth/login")}
          className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 h-9 rounded-lg cursor-pointer"
        >
          {t.nav?.signIn || "Sign In"}
        </Button>
      </div>
    );
  }

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

            {/* Detected Soil Context */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-[11px] font-semibold">
              <Layers className="size-3" />
              {isDetectingSoil ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : (
                <span>{SOIL_TYPE_OPTIONS.find((opt) => opt.value === soilType)?.label || soilType}</span>
              )}
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

        {/* INPUT DROPDOWNS FORM (SEASON, IRRIGATION METHOD) */}
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. SEASON DROPDOWN */}
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

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-1 flex-wrap">
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || isDownloadingPdf || !hasAdvisoryData}
              variant="outline"
              className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs sm:text-sm h-9 px-4 rounded-lg shadow-2xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <>
                  <LoaderCircle className="size-4 animate-spin text-emerald-600" />
                  <span>Preparing PDF...</span>
                </>
              ) : (
                <>
                  <Download className="size-4 text-emerald-600" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>

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

      {/* PRINTABLE REPORT WRAPPER FOR PDF EXPORT */}
      <div id="presowing-printable-area" className="flex flex-col gap-4 w-full">
        {/* PDF REPORT HEADER (Rendered in exported PDF document with brand mark and selections) */}
        <div
          id="presowing-pdf-header"
          data-pdf-card="true"
          style={{ display: "none" }}
          className="w-full bg-white text-gray-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xs"
        >
          {/* Header Row: Logo & Document Title */}
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <FarmRiskLogo size={36} />
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  FarmRisk
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Pre-Sowing Advisory
                  </span>
                </h1>
                <p className="text-xs text-gray-600 font-medium">
                  Agronomic Intelligence &amp; ICAR Package of Practices
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-800 block uppercase tracking-wider">
                Official Advisory Document
              </span>
              <span className="text-xs text-gray-500">
                Generated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Selections / Parameters Summary Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide block">
                Selected Crop
              </span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                <Sprout className="size-3.5 text-emerald-600" />
                {selectedCrop?.name || crop}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide block">
                Region / State
              </span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                <MapPin className="size-3.5 text-gray-500" />
                {state}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide block">
                Soil Profile
              </span>
              <span className="text-sm font-bold text-amber-800 flex items-center gap-1.5 mt-0.5 capitalize">
                <Layers className="size-3.5 text-amber-600" />
                {soilType}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide block">
                Season &amp; Irrigation
              </span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5 capitalize">
                <Calendar className="size-3.5 text-emerald-600" />
                {season} · {irrigationType}
              </span>
            </div>
          </div>

          {/* Grounding Info */}
          {(data?.rag_sources_used ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <BookOpen className="size-3.5 text-emerald-600" />
                Grounding: {data?.rag_sources_used} ICAR &amp; KVK scientific packages synthesized
              </span>
              <span className="text-gray-500">Language: {language.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* 7 PRE-SOWING COMPONENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-stretch">
        {/* 1. Sowing Window / Timeline */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <SowingTimeline
            content={sections?.sowing_window}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 2. Seed Selection */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <SeedSelection
            content={sections?.seed_selection}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 3. Field Preparation */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <FieldPreparation
            content={sections?.field_preparation}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 4. Fertilizer Plan */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <FertilizerPlan
            content={sections?.fertilizer_plan}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 5. Irrigation Schedule */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <IrrigationSchedule
            content={sections?.irrigation}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 6. Weed Management */}
        <div data-pdf-card="true" className="col-span-1 flex">
          <WeedManagement
            content={sections?.weed_management}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>

        {/* 7. Pest & Disease Calendar (Full width on large screens) */}
        <div data-pdf-card="true" className="col-span-1 lg:col-span-2 flex">
          <PestDiseaseCalendar
            content={sections?.pest_disease}
            isLoading={isGenerating}
            error={error?.message}
            onRetry={refetch}
          />
        </div>
      </div>

      {/* NEAREST KRISHI VIGYAN KENDRA (KVK) GUIDANCE FOOTER */}
      <div data-pdf-card="true" className="w-full">
        <NearestKVKFooter />
      </div>
      </div>
    </div>
  );
}

export default PreSowing;
