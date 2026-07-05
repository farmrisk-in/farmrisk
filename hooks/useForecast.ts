"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getForecast } from "@/lib/api/forecast";
import { useLocationContext } from "@/providers/LocationProvider";
import { ForecastAPIResponse } from "@/types/forecast";

export function useForecast(days: number = 16) {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<ForecastAPIResponse, Error>({
    queryKey: ["forecast", location.lat, location.lng, days],
    queryFn: () => getForecast(location.lat, location.lng, days),
    enabled: !isResolving && !!location.lat && !!location.lng,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-forecast-loading"));
    } else if (query.data?.success) {
      try {
        localStorage.setItem(
          "farmrisk-forecast-predictions",
          JSON.stringify(query.data.predictions)
        );
      } catch (e) {
        console.error("Failed to save forecast data to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-forecast-loaded", {
          detail: query.data.predictions,
        })
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data?.predictions,
    isLoading: isResolving || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
