"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeather } from "@/lib/api/weather";
import { useLocationContext } from "@/providers/LocationProvider";
import {
  type CurrentWeather,
  type HourlySlot,
  type ForecastSlot,
  type LightnindData,
  type WeatherPayload,
} from "@/types/weather";

export type {
  CurrentWeather,
  HourlySlot,
  ForecastSlot,
  LightnindData,
  WeatherPayload,
};

export function useWeather() {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<WeatherPayload, Error>({
    queryKey: ["weather", location.lat, location.lng],
    queryFn: () => getWeather(location.lat, location.lng),
    enabled: !isResolving,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });

  return {
    isLoading: isResolving || query.isLoading,
    isError: !isResolving && query.isError,
    errorMessage:
      !isResolving && query.error
        ? query.error.message || "Weather request failed"
        : undefined,
    current: !isResolving && query.data ? query.data.current : undefined,
    hourly: !isResolving && query.data ? query.data.hourly : undefined,
    forecast: !isResolving && query.data ? query.data.forecast : undefined,
    lightning: !isResolving && query.data ? query.data.lightning : undefined,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
