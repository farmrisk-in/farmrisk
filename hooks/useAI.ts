"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAIAdvisory } from "@/lib/api/ai";
import { useLocationContext } from "@/providers/LocationProvider";
import { AIAPIResponse } from "@/types/ai";

export function useAI(cropId: string, language: string) {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<AIAPIResponse, Error>({
    queryKey: ["ai", location.lat, location.lng, cropId, language],
    queryFn: () => getAIAdvisory(location.lat, location.lng, cropId, language),
    enabled: !isResolving && !!location.lat && !!location.lng && !!cropId && !!language,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-ai-loading"));
    } else if (query.data?.advisory_summary) {
      try {
        localStorage.setItem("farmrisk-ai-advisory", query.data.advisory_summary);
      } catch (e) {
        console.error("Failed to save AI advisory to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-ai-loaded", {
          detail: query.data.advisory_summary,
        })
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data?.advisory_summary,
    isLoading: isResolving || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
