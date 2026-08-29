"use client";

import React from "react";
import { CalendarRange } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface SowingTimelineProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function SowingTimeline({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: SowingTimelineProps) {
  const { t } = useLanguage();

  const title = t.tools?.sowingTimeline || "Sowing Window / Timeline";
  const description =
    t.tools?.sowingTimelineDesc ||
    "Optimal sowing dates, temperature window, and monsoon alignment.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={CalendarRange}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Analyzing optimal sowing window..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No sowing timeline available yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Sowing window recommendation based on weather forecasts and crop calendar will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default SowingTimeline;
