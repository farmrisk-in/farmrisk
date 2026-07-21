"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeather } from "@/lib/api/weather";
import { useLocationContext } from "@/providers/LocationProvider";
import { type OpenMeteoResponse } from "@/types/weather";

export function useWeather() {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<OpenMeteoResponse, Error>({
    queryKey: ["weather", location?.lat, location?.lng],
    queryFn: () => getWeather(location!.lat, location!.lng),
    enabled: !isResolving && !!location,
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  return {
    isLoading: isResolving || !location || query.isLoading,
    isError: !isResolving && !!location && query.isError,
    errorMessage:
      !isResolving && query.error
        ? query.error.message || "Weather request failed"
        : undefined,
    data: query.data,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
