"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { MarkdownViewer } from "@/components/dashboard/tools/MarkdownViewer";
import { useLanguage } from "@/hooks/useLanguage";

export interface WeedManagementProps {
  content?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function WeedManagement({
  content = null,
  isLoading = false,
  error = null,
  onRetry,
  className,
}: WeedManagementProps) {
  const { t } = useLanguage();

  const title = t.tools?.weedManagement || "Weed Management";
  const description =
    t.tools?.weedManagementDesc ||
    "Pre-emergence herbicide applications, cultural methods, and critical weed-free period.";

  return (
    <ToolCard
      title={title}
      description={description}
      icon={ShieldAlert}
      isLoading={isLoading}
      loadingText={t.tools?.loadingAdvisory || "Formulating weed management protocols..."}
      error={error}
      onRetry={onRetry}
      isEmpty={!content || !content.trim()}
      emptyMessage={t.tools?.noDataYet || "No weed management plan yet"}
      emptySubtext={
        t.tools?.noDataDesc ||
        "Pre-emergence and cultural weed control guidance will appear here."
      }
      className={className}
    >
      <MarkdownViewer content={content} />
    </ToolCard>
  );
}

export default WeedManagement;
