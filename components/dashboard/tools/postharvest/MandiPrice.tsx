"use client";

import React from "react";
import { Store, IndianRupee, TrendingUp, TrendingDown, Scale, RefreshCw } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocationContext } from "@/providers/LocationProvider";

export interface MandiPriceMetric {
  modalPrice?: number | string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  arrivals?: string | null;
  mandiName?: string | null;
  trend?: "up" | "down" | "stable" | null;
}

export interface MandiPriceProps {
  content?: string | null; // markdown string
  metrics?: MandiPriceMetric | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function MandiPrice({
  content = null,
  metrics = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: MandiPriceProps) {
  const { t } = useLanguage();
  const { selectedCrop } = useSelectedCrop();
  const { location } = useLocationContext();

  const title = t.tools?.mandiPrice || "Mandi Price";
  const desc =
    t.tools?.mandiPriceDesc ||
    "Wholesale APMC market arrivals and modal trading rates for the selected crop.";

  // By default, components are empty
  const hasData = Boolean((content && content.trim()) || metrics);

  return (
    <ToolCard
      title={title}
      description={desc}
      icon={Store}
      badge={
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {selectedCrop.name}
        </span>
      }
      action={
        location?.name ? (
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            📍 {location.name}
          </span>
        ) : undefined
      }
      isLoading={isLoading}
      loadingText={t.tools?.loadingMandi || "Fetching live APMC mandi prices..."}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      {/* 1. LOADING SKELETON (Detailed Mandi Layout) */}
      {isLoading && (
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* 2. DEFAULT EMPTY STATE */}
      {!isLoading && !error && !hasData && (
        <div className="flex flex-col gap-4 py-2">
          {/* PLACEHOLDER METRIC STATS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t.tools?.modalPrice || "Modal Price"}
              </span>
              <span className="text-base font-bold text-muted-foreground/60 flex items-center">
                <IndianRupee className="size-3.5" /> — / Qtl
              </span>
              <span className="text-[10px] text-muted-foreground/50">Benchmark</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t.tools?.minPrice || "Min Price"}
              </span>
              <span className="text-base font-bold text-muted-foreground/60 flex items-center">
                <IndianRupee className="size-3.5" /> — / Qtl
              </span>
              <span className="text-[10px] text-muted-foreground/50">Base bid</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t.tools?.maxPrice || "Max Price"}
              </span>
              <span className="text-base font-bold text-muted-foreground/60 flex items-center">
                <IndianRupee className="size-3.5" /> — / Qtl
              </span>
              <span className="text-[10px] text-muted-foreground/50">Top grade</span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t.tools?.arrivals || "Arrivals"}
              </span>
              <span className="text-base font-bold text-muted-foreground/60 flex items-center">
                <Scale className="size-3.5 mr-1" /> — Tonnes
              </span>
              <span className="text-[10px] text-muted-foreground/50">Daily volume</span>
            </div>
          </div>

          {/* EMPTY PROMPT BOX */}
          <div className="flex flex-col items-center justify-center py-7 px-4 rounded-xl border border-dashed border-border bg-muted/10 text-center select-none">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60 mb-2.5">
              <Store className="size-5" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-foreground/80">
              {t.tools?.emptyMandiTitle || "No mandi price data loaded yet"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-md leading-relaxed">
              {t.tools?.emptyMandiDesc ||
                `Real-time APMC wholesale rates and market trends for ${selectedCrop.name} in your regional mandis will appear here once connected to the price feed.`}
            </p>
          </div>
        </div>
      )}

      {/* 3. LOADED DATA / MARKDOWN STATE */}
      {!isLoading && !error && hasData && (
        <div className="flex flex-col gap-4 py-2">
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t.tools?.modalPrice || "Modal Price"}
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <IndianRupee className="size-4" /> {metrics.modalPrice} / Qtl
                </span>
                {metrics.mandiName && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {metrics.mandiName}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t.tools?.minPrice || "Min Price"}
                </span>
                <span className="text-lg font-bold text-foreground flex items-center">
                  <IndianRupee className="size-4" /> {metrics.minPrice ?? "—"} / Qtl
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t.tools?.maxPrice || "Max Price"}
                </span>
                <span className="text-lg font-bold text-foreground flex items-center">
                  <IndianRupee className="size-4" /> {metrics.maxPrice ?? "—"} / Qtl
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t.tools?.arrivals || "Arrivals"}
                </span>
                <span className="text-lg font-bold text-foreground flex items-center">
                  <Scale className="size-4 mr-1" /> {metrics.arrivals ?? "—"}
                </span>
              </div>
            </div>
          )}

          {content && <MarkdownViewer content={content} />}
        </div>
      )}
    </ToolCard>
  );
}

export default MandiPrice;
