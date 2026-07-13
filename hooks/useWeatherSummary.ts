"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeatherSummary, WeatherSummaryResponse } from "@/lib/api/weatherSummary";
import { useLocationContext } from "@/providers/LocationProvider";
import { useCalendar } from "@/hooks/useCalendar";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";

export function useWeatherSummary(language: string) {
  const { location, isResolving } = useLocationContext();

  const calendarData = useCalendar("general").data;
  const weatherData = useWeather().data;
  const { data: forecastData, isLoading: isForecastLoading } = useForecast();

  // Create a stable fingerprint of the forecast data to ensure cache uniqueness
  const forecastHash = forecastData?.forecast?.success
    ? forecastData.forecast.forecast.map((d) => `${d.date}:${d.pcp_corrected}`).join(",")
    : "none";

  const query = useQuery<WeatherSummaryResponse, Error>({
    queryKey: ["weather-summary", location.lat, location.lng, language, forecastHash],
    queryFn: () => {
      if (!calendarData || !weatherData) {
        throw new Error("Context data not available for weather summary generation");
      }
      return getWeatherSummary({
        location,
        cropId: "general",
        calendarData,
        weatherData,
        forecastData: forecastData ?? undefined,
        language,
      });
    },
    enabled:
      !isResolving &&
      !isForecastLoading &&
      !!location.lat &&
      !!location.lng &&
      !!language &&
      !!calendarData &&
      !!weatherData,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
    retry: false, // Don't retry endlessly if it fails
  });

  return {
    data: query.data?.weather_summary,
    isLoading: isResolving || query.isLoading || isForecastLoading || !calendarData || !weatherData,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
  };
}
