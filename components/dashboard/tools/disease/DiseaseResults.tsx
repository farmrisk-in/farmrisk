"use client";

import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  Bug,
  Activity,
  Wind,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Microscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownViewer } from "../MarkdownViewer";
import type { DiseaseAnalysisResult } from "@/types/disease";

interface DiseaseResultsProps {
  result: DiseaseAnalysisResult;
  previewUrl: string | null;
  onReset: () => void;
}

export function DiseaseResults({
  result,
  previewUrl,
  onReset,
}: DiseaseResultsProps) {
  const { t } = useLanguage();
  const tools = t.tools;
  const { prediction, advisory } = result;
  const isHealthy = prediction.is_healthy;
  const confidencePercent = Math.round(
    prediction.confidence > 1
      ? prediction.confidence
      : prediction.confidence * 100,
  );

  const [showTopK, setShowTopK] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Format label name for display: replace underscores with spaces
  const formatLabel = (raw: string) => raw.replace(/_/g, " ");

  // Helper to format text with **bold** markers cleanly
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const cleaned = text.replace(/\*\*\s*([^*]+?)\s*\*\*/g, "**$1**");
    const parts = cleaned.split(/(\*\*[^*]+?\*\*)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-extrabold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  // Standardize advisory sections
  const sections = advisory?.sections || {};
  const sectionKeys = Object.keys(sections);

  // Icon mapping for advisory sections
  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("symptom")) return <Stethoscope className="size-4 text-amber-500" />;
    if (lower.includes("pathogen")) return <Bug className="size-4 text-rose-500" />;
    if (lower.includes("condition")) return <Activity className="size-4 text-sky-500" />;
    if (lower.includes("survival") || lower.includes("spread"))
      return <Wind className="size-4 text-indigo-500" />;
    if (lower.includes("manage") || lower.includes("control") || lower.includes("treatment"))
      return <ShieldAlert className="size-4 text-emerald-500" />;
    return <Sparkles className="size-4 text-emerald-500" />;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. TOP DIAGNOSIS BANNER */}
      <div
        className={`border rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all ${
          isHealthy
            ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
            : "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20"
        }`}
      >
        <div className="flex items-start sm:items-center gap-4">
          {previewUrl && (
            <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted/40 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Analyzed sample"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isHealthy
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                }`}
              >
                {isHealthy ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    {tools?.healthyCrop || "Healthy Crop"}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3.5" />
                    {tools?.diseaseDetected || "Disease Detected"}
                  </>
                )}
              </span>

              {prediction.is_low_confidence && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Info className="size-3" /> {tools?.lowConfidence || "Low Confidence"} (&lt;{Math.round((prediction.threshold || 0.5) * 100)}%)
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {formatLabel(prediction.top_prediction)}
            </h3>

            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-0.5">
              {prediction.note ? (
                renderFormattedText(prediction.note)
              ) : isHealthy ? (
                tools?.healthyGuidanceDesc || "No active pathogen infection detected on leaf tissue."
              ) : (
                "Visual symptoms match pathogen profile in the ICAR agronomic database."
              )}
            </div>
          </div>
        </div>

        {/* CONFIDENCE & ACTIONS */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
          <div className="flex flex-col items-start md:items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">{tools?.modelConfidence || "Model Confidence"}:</span>
              <span className="text-sm font-bold text-foreground">
                {prediction.confidence_pct || `${confidencePercent}%`}
              </span>
            </div>
            <div className="w-28 sm:w-36 h-2 rounded-full bg-muted overflow-hidden border border-border/50">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isHealthy ? "bg-emerald-500" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(1, confidencePercent))}%` }}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs font-semibold h-8 rounded-lg border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>{tools?.scanAnother || "Scan Another"}</span>
          </Button>
        </div>
      </div>

      {/* 2. TOP-K CANDIDATES ACCORDION (If multiple returned) */}
      {prediction.top_k && prediction.top_k.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowTopK(!showTopK)}
            className="w-full flex items-center justify-between text-xs font-semibold text-foreground/90 hover:text-foreground cursor-pointer select-none"
          >
            <span className="flex items-center gap-2">
              <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {tools?.alternativePredictions || "Alternative Classifications"} ({prediction.top_k.length})
            </span>
            {showTopK ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {showTopK && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3 mt-3 border-t border-border">
              {prediction.top_k.map((item, idx) => {
                const itemConf = Math.round(
                  item.confidence > 1 ? item.confidence : item.confidence * 100,
                );
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border bg-muted/20 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[150px]">
                        {formatLabel(item.label)}
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {item.confidence_pct || `${itemConf}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.is_healthy ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(1, itemConf))}%` }}
                      />
                    </div>
                    {item.crop && (
                      <span className="text-[10px] text-muted-foreground">
                        Crop: {item.crop}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. AGRONOMIC ADVISORY & TREATMENT SECTION */}
      {sectionKeys.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Microscope className="size-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {tools?.managementAdvisory || "ICAR Agronomic Management Advisory"}
              </h4>
            </div>

            {/* TAB SELECTOR FOR SECTIONS */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tools?.allSections || "All Sections"}
              </button>
              {sectionKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* RENDER ADVISORY SECTIONS */}
          <div className="flex flex-col gap-4">
            {sectionKeys
              .filter((key) => activeTab === "all" || activeTab === key)
              .map((key) => {
                const sectionContent = sections[key];
                return (
                  <div
                    key={key}
                    className="border border-border/80 rounded-lg p-4 sm:p-5 bg-muted/15 flex flex-col gap-2.5 transition-all"
                  >
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm sm:text-base">
                      {getSectionIcon(key)}
                      <span>{key}</span>
                    </div>

                    <div className="pt-1 text-foreground/95 text-sm sm:text-base">
                      <MarkdownViewer
                        content={sectionContent}
                        emptyMessage="No section details available."
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : advisory?.markdown ? (
        /* FALLBACK FULL MARKDOWN ADVISORY */
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Microscope className="size-4 text-emerald-600" />
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              {tools?.managementAdvisory || "ICAR Agronomic Management Advisory"}
            </h4>
          </div>
          <MarkdownViewer content={advisory.markdown} />
        </div>
      ) : isHealthy ? (
        /* HEALTHY PLANT GUIDANCE */
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col items-center text-center gap-3 py-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="max-w-md flex flex-col gap-1">
            <h4 className="text-base font-bold text-foreground">
              {tools?.healthyGuidanceTitle || "Plant Appears Healthy"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tools?.healthyGuidanceDesc ||
                "Our vision classifier did not detect signs of foliar blight, rust, mildew, or nutrient deficiency. Continue standard irrigation and scheduled organic/NPK nutrition according to your crop cycle."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
