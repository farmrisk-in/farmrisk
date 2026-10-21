"use client";

import React from "react";
import { CropSelector } from "@/components/dashboard/farmrisk/CropSelector";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ScanSearch, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiseaseDetection } from "@/hooks/useDiseaseDetection";
import { DiseaseUploader } from "./disease/DiseaseUploader";
import { DiseaseResults } from "./disease/DiseaseResults";

/**
 * "Disease Detection" Tool Page
 *
 * Gated feature:
 * - Powered by Vision Transformer (DeiT) crop pathology classification
 * - Curated ICAR / Agronomic advisory integration for immediate treatment guidance
 * - Available to logged-in users
 */
export function DiseaseDetection() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const {
    file,
    previewUrl,
    isAnalyzing,
    progressStage,
    result,
    error,
    selectFile,
    clearSelection,
    analyze,
  } = useDiseaseDetection();

  const title = t.tools?.diseaseDetection || "Disease Detection";
  const desc =
    t.tools?.diseaseDetectionDesc ||
    "AI leaf scan to diagnose crop diseases and ICAR treatment guidelines.";

  // Authentication gate: only available if logged in
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none bg-card border border-border rounded-xl shadow-sm my-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/20">
          <Lock className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-md leading-relaxed">
          AI-powered crop pathology diagnosis and ICAR treatment advisories are
          exclusive to registered accounts. Please sign in to access.
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
      {/* CROP & LOCATION SELECTORS */}
      <CropSelector />
      <LocationSearchBar />

      {/* HEADER CARD */}
      <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <ScanSearch className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-medium text-muted-foreground px-2.5 py-1 rounded-lg bg-muted/50 border border-border">
            {t.tools?.supportedPathologies || "110+ Crop Pathologies Supported"}
          </span>
        </div>
      </div>

      {/* WORKSPACE: UPLOADER OR RESULTS */}
      {!result ? (
        <div className="flex flex-col gap-4">
          <DiseaseUploader
            file={file}
            previewUrl={previewUrl}
            isAnalyzing={isAnalyzing}
            progressStage={progressStage}
            error={error}
            onSelectFile={selectFile}
            onClear={clearSelection}
            onAnalyze={analyze}
          />
        </div>
      ) : (
        <DiseaseResults
          result={result}
          previewUrl={previewUrl}
          onReset={clearSelection}
        />
      )}
    </div>
  );
}

export default DiseaseDetection;
