"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getWhatToDo, WhatToDoResponse } from "@/lib/api/whatToDo";
import { useAIRequestPayload } from "@/hooks/useAIRequestPayload";

/**
 * Fetch the "What To Do Today" card for the selected field.
 *
 * The card uses the FULL advisory payload (weather + bias-corrected forecast
 * + soil moisture) — the same context that powers the AI advisory — so it
 * only fires once that complete context is ready. The backend deterministically
 * aggregates the best Pest & Disease action + best Irrigation recommendation
 * from the EXISTING systems (weather actions fill empty slots as a fallback).
 * It does NOT wait for the AI Overview generation: this is its own request.
 *
 * Selection and severity are decided by the backend, never by the frontend.
 */
export function useWhatToDo(cropId: string, language: string) {
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

  const query = useQuery<WhatToDoResponse, Error>({
    queryKey: [
      "what-to-do",
      location?.lat,
      location?.lng,
      cropId,
      language,
      forecastHash,
    ],
    queryFn: () => {
      if (!location || !calendarData || !weatherData || !mockVillageReport) {
        throw new Error("Context data not available for what-to-do card");
      }
      return getWhatToDo({
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
    recommendations: query.data?.recommendations ?? [],
    isLoading: isContextLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error || errors.calendar || errors.weather,
    isError: query.isError || !!errors.calendar || !!errors.weather,
    refetch: query.refetch,
  };
}