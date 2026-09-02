"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchPresowingAdvisory,
  PresowingRequest,
  PresowingResponse,
} from "@/lib/api/preSowing";

export interface UsePreSowingParams extends Partial<PresowingRequest> {
  enabled?: boolean;
}

/**
 * React Query hook for fetching RAG-backed Pre-Sowing advisory.
 * Manages caching, background refetching, and structured section delivery.
 */
export function usePreSowing({
  crop,
  state,
  soil_type,
  season = "Kharif",
  irrigation_type = "flood",
  language = "en",
  enabled = true,
}: UsePreSowingParams) {
  const isParamsValid = Boolean(crop?.trim() && state?.trim() && soil_type);

  const query = useQuery<PresowingResponse, Error>({
    queryKey: [
      "pre-sowing-advisory",
      crop?.toLowerCase().trim(),
      state?.toLowerCase().trim(),
      soil_type,
      season,
      irrigation_type,
      language,
    ],
    queryFn: () => {
      if (!crop || !state || !soil_type) {
        throw new Error("Missing required parameters: crop, state, or soil_type");
      }
      return fetchPresowingAdvisory({
        crop: crop.trim(),
        state: state.trim(),
        soil_type,
        season,
        irrigation_type,
        language,
      });
    },
    enabled: enabled && isParamsValid,
    placeholderData: keepPreviousData,
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
  });

  return {
    data: query.data,
    sections: query.data?.sections,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isReady: isParamsValid,
  };
}

export default usePreSowing;
