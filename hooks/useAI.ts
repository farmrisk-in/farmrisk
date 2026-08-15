"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAIAdvisory } from "@/lib/api/ai";
import { useAIRequestPayload } from "@/hooks/useAIRequestPayload";
import { AIAPIResponse } from "@/types/ai";

export function useAI(cropId: string, language: string) {
  const {
    payload,
    location,
    isDataReady,
    isLoading,
    isFetching,
    forecastHash,
    errors,
  } = useAIRequestPayload(cropId, language);

  const query = useQuery<AIAPIResponse, Error>({
    queryKey: [
      "ai",
      location?.lat,
      location?.lng,
      cropId,
      language,
      forecastHash,
    ],
    queryFn: () => {
      if (!payload) {
        throw new Error("Context data not available for AI generation");
      }
      return getAIAdvisory(payload);
    },
    enabled: isDataReady,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-ai-loading"));
    } else if (query.data?.advisory_summary) {
      try {
        localStorage.setItem(
          "farmrisk-ai-advisory",
          query.data.advisory_summary,
        );
      } catch (e) {
        console.error("Failed to save AI advisory to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-ai-loaded", {
          detail: query.data.advisory_summary,
        }),
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data?.advisory_summary,
    irrigationInsight: query.data?.irrigation_insight || null,
    sources: query.data?.sources || [],
    isLoading: isLoading || query.isLoading,
    isFetching: isFetching || query.isFetching,
    error: query.error || errors.calendar || errors.weather,
    isError: query.isError || !!errors.calendar || !!errors.weather,
    refetch: query.refetch,
  };
}
