"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getForecast } from "@/lib/api/forecast";
import { useLocationContext } from "@/providers/LocationProvider";
import { ForecastResponse, ForecastRow } from "@/types/forecast";
import { useWeather } from "./useWeather";

export function useForecast() {
  const { location, isResolving } = useLocationContext();
  const { data: weatherData, isLoading: isWeatherLoading } = useWeather();
  const daily = weatherData?.daily;

  // Pre-mapped fallback raw forecast data in the format of ForecastRow[]
  const rawForecastRows: ForecastRow[] = daily
    ? daily.time.map((time, idx) => ({
        date: new Date(time).toISOString().split("T")[0],
        tmax: daily.temperature_2m_max[idx],
        tmax_corrected: daily.temperature_2m_max[idx],
        tmin: daily.temperature_2m_min[idx],
        tmin_corrected: daily.temperature_2m_min[idx],
        pcp: daily.precipitation_sum[idx],
        pcp_corrected: daily.precipitation_sum[idx],
        is_forecast: 1 as const,
      }))
    : [];

  const query = useQuery<any[], Error>({
    queryKey: [
      "forecast",
      location?.lat,
      location?.lng,
    ],
    queryFn: async () => {
      return getForecast(location!.lat, location!.lng);
    },
    enabled: !isResolving && !!location?.lat && !!location?.lng,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  // Map simplified API results to contain compatibility fields for tmax_corrected, tmin_corrected, etc.
  const forecastRows: ForecastRow[] = (query.data && query.data.length > 0)
    ? query.data.map((row: any) => ({
        ...row,
        tmax_corrected: row.tmax !== undefined ? row.tmax : row.tmax_corrected,
        tmin_corrected: row.tmin !== undefined ? row.tmin : row.tmin_corrected,
        pcp_corrected: row.pcp !== undefined ? row.pcp : row.pcp_corrected,
        is_forecast: row.is_forecast !== undefined ? row.is_forecast : 1,
      }))
    : rawForecastRows;

  // Forecast successfully loaded if we have data from either correction API or raw fallback
  const isSuccess = query.isSuccess || (!query.isLoading && query.isError && rawForecastRows.length > 0);

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-forecast-loading"));
    } else if (isSuccess && forecastRows.length > 0) {
      try {
        localStorage.setItem(
          "farmrisk-forecast-predictions",
          JSON.stringify(forecastRows),
        );
      } catch (e) {
        console.error("Failed to save forecast data to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-forecast-loaded", {
          detail: forecastRows,
        }),
      );
    }
  }, [forecastRows, query.isFetching, isSuccess]);

  // Construct wrapped backward-compatible ForecastResponse structure for components/AI
  const wrappedResponse: ForecastResponse | undefined = (query.data && location)
    ? {
        success: true,
        location: { lat: location.lat, lon: location.lng },
        cold_start: false,
        forecast: forecastRows,
        runtime: { total_seconds: 0 },
      }
    : undefined;

  return {
    data: wrappedResponse,
    forecastRows,
    isLoading: isResolving || !location || isWeatherLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError && rawForecastRows.length === 0,
    isCorrectionFailed: query.isError,
    isSuccess,
    refetch: query.refetch,
  };
}
export default useForecast;
