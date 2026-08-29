"use client";

import React from "react";
import { Droplets } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface IrrigationScheduleProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function IrrigationSchedule({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: IrrigationScheduleProps) {
  const { t } = useLanguage();

  const title = t.tools?.irrigationSchedule || "Irrigation Schedule";
  const description =
    t.tools?.irrigationScheduleDesc ||
    "Pre-sowing wetting (palevo), critical growth stage water requirements, and intervals.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={Droplets}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Generating pre-sowing irrigation guidelines..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No irrigation schedule available yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Pre-sowing irrigation recommendations and critical watering stages will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default IrrigationSchedule;
