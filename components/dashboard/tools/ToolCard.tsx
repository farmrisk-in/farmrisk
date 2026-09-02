"use client";

import React, { ReactNode } from "react";
import { type LucideIcon, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface ToolCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  action?: ReactNode;
  badge?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptySubtext?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Standard card shell for Tool components.
 * Matches FarmRisk design patterns with:
 * - Unified header with Lucide icon in emerald container
 * - Integrated animated skeleton state for loading
 * - Integrated error banner with retry option
 * - Integrated clean empty state
 */
export function ToolCard({
  title,
  description,
  icon: Icon,
  iconColor,
  action,
  badge,
  isLoading = false,
  loadingText,
  error = null,
  onRetry,
  isEmpty = false,
  emptyMessage,
  emptySubtext,
  children,
  className,
}: ToolCardProps) {
  return (
    <div
      className={cn(
        "w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm flex flex-col transition-all",
        className,
      )}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3 gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="size-5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-foreground truncate">
                {title}
              </h3>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {description && (
              <p className="text-[11px] text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* CARD BODY STATES */}
      <div className="grow min-h-0">
        {/* 1. LOADING SKELETON */}
        {isLoading && (
          <div className="space-y-2.5 py-2">
            {loadingText && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
                <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{loadingText}</span>
              </div>
            )}
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg hidden sm:block" />
            </div>
          </div>
        )}

        {/* 2. ERROR STATE */}
        {!isLoading && error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive dark:text-red-400">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold">Unable to load information</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {error}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. EMPTY STATE */}
        {!isLoading && !error && isEmpty && (
          <div className="flex flex-col items-center justify-center py-7 px-4 text-center select-none">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60 mb-2">
              <Icon className="size-4.5" />
            </div>
            <p className="text-xs font-semibold text-foreground/80">
              {emptyMessage || "No data available yet"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
              {emptySubtext ||
                "Advisory information will appear here once generated."}
            </p>
          </div>
        )}

        {/* 4. CONTENT / CHILDREN */}
        {!isLoading && !error && !isEmpty && children}
      </div>
    </div>
  );
}

export default ToolCard;
