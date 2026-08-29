"use client";

import React from "react";
import { FlaskConical } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface FertilizerPlanProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function FertilizerPlan({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: FertilizerPlanProps) {
  const { t } = useLanguage();

  const title = t.tools?.fertilizerPlan || "Fertilizer Plan";
  const description =
    t.tools?.fertilizerPlanDesc ||
    "Basal doses, NPK nutrient ratio, organic manure incorporation, and micronutrients.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={FlaskConical}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Calculating basal fertilizer and nutrient requirements..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No fertilizer plan available yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Recommended basal fertilizer doses and manure schedules will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default FertilizerPlan;
