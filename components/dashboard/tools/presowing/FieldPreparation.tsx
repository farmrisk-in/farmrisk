"use client";

import React from "react";
import { Tractor } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface FieldPreparationProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function FieldPreparation({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: FieldPreparationProps) {
  const { t } = useLanguage();

  const title = t.tools?.fieldPreparation || "Field Preparation";
  const description =
    t.tools?.fieldPreparationDesc ||
    "Ploughing depth, tilth preparation, levelling, and drainage alignment.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={Tractor}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Generating tillage and field preparation advisory..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No field preparation guidelines yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Soil preparation steps, tillage schedule, and bed formatting will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default FieldPreparation;
