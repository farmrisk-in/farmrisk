"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getForecast } from "@/lib/api/forecast";
import { useLocationContext } from "@/providers/LocationProvider";
import { VillageReportAPIResponse, ForecastDataDaily } from "@/types/forecast";
import { useWeather } from "./useWeather";
import { getVID } from "@/lib/utils";

export function useForecast() {
  const { location, isResolving } = useLocationContext();
  const { data: weatherData, isLoading: isWeatherLoading } = useWeather();
  const daily = weatherData?.daily;

  const query = useQuery<VillageReportAPIResponse, Error>({
    queryKey: [
      "forecast",
      location.lat,
      location.lng,
      getVID(location.lat, location.lng),
      daily,
    ],
    queryFn: () => {
      const mappedDaily: ForecastDataDaily | undefined = daily
        ? {
            time: daily.time.map(
              (t) => new Date(t).toISOString().split("T")[0],
            ),
            temperature_2m_max: daily.temperature_2m_max,
            temperature_2m_min: daily.temperature_2m_min,
            precipitation_sum: daily.precipitation_sum,
          }
        : undefined;
      return getForecast(location.lat, location.lng, mappedDaily);
    },
    enabled: !isResolving && !!location.lat && !!location.lng && !!daily,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-forecast-loading"));
    } else if (query.data?.forecast?.success) {
      try {
        localStorage.setItem(
          "farmrisk-forecast-predictions",
          JSON.stringify(query.data.forecast.forecast),
        );
      } catch (e) {
        console.error("Failed to save forecast data to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-forecast-loaded", {
          detail: query.data.forecast.forecast,
        }),
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data,
    isLoading: isResolving || isWeatherLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
