"use client";

import React from "react";
import { Bug } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface PestDiseaseCalendarProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function PestDiseaseCalendar({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: PestDiseaseCalendarProps) {
  const { t } = useLanguage();

  const title = t.tools?.pestDiseaseCalendar || "Pest & Disease Calendar";
  const description =
    t.tools?.pestDiseaseCalendarDesc ||
    "Early stage vulnerabilities, trap cropping, and preventive seed/soil bio-control calendar.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={Bug}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Building pest and disease calendar..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No pest & disease calendar available yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Early crop protection calendar and preventive biological/chemical management will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default PestDiseaseCalendar;
