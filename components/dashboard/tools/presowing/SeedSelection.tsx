"use client";

import React from "react";
import { Sprout } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface SeedSelectionProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function SeedSelection({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: SeedSelectionProps) {
  const { t } = useLanguage();

  const title = t.tools?.seedSelection || "Seed Selection";
  const description =
    t.tools?.seedSelectionDesc ||
    "Recommended certified cultivars, seeding rate, and seed treatment protocol.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={Sprout}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Fetching seed varieties and treatment guidelines..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No seed selection guidelines yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Recommended varieties and seed treatment protocols for your chosen crop will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default SeedSelection;
