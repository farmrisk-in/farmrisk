"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getPestDiseaseCard, PestDiseaseCardResponse } from "@/lib/api/pestDisease";
import { useAIRequestPayload } from "@/hooks/useAIRequestPayload";

/**
 * Fetch the crop-specific Pest & Disease card for the selected field.
 *
 * The card uses the FULL advisory payload (weather + bias-corrected forecast
 * + soil moisture), so it only fires once that complete context is ready —
 * the same context that powers the AI advisory. This is the accurate,
 * intended card (forecast-based risk score, soil-moisture input, RAG grounded
 * in weather context).
 *
 * The `risk` band and `score` are deterministic (backend) — never LLM-decided.
 */
export function usePestDisease(cropId: string, language: string) {
  const {
    location,
    isDataReady,
    isLoading: isContextLoading,
    calendarData,
    weatherData,
    mockVillageReport,
    forecastHash,
    errors,
  } = useAIRequestPayload(cropId, language);

  const query = useQuery<PestDiseaseCardResponse, Error>({
    queryKey: [
      "pest-disease",
      location?.lat,
      location?.lng,
      cropId,
      language,
      forecastHash,
    ],
    queryFn: () => {
      if (!location || !calendarData || !weatherData || !mockVillageReport) {
        throw new Error("Context data not available for pest & disease card");
      }
      return getPestDiseaseCard({
        location,
        cropId,
        calendarData,
        weatherData,
        language,
        forecastData: mockVillageReport,
      });
    },
    enabled: isDataReady,
    placeholderData: keepPreviousData,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  return {
    data: query.data,
    isLoading: isContextLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error || errors.calendar || errors.weather,
    isError: query.isError || !!errors.calendar || !!errors.weather,
    refetch: query.refetch,
  };
}