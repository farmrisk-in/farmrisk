"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAIAdvisory } from "@/lib/api/ai";
import { useLocationContext } from "@/providers/LocationProvider";
import { useCalendar } from "@/hooks/useCalendar";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { useIrrigation } from "@/hooks/useIrrigation";
import { AIAPIResponse } from "@/types/ai";
import { VillageReportAPIResponse } from "@/types/forecast";

export function useAI(cropId: string, language: string) {
  const { location, isResolving } = useLocationContext();

  const daysbefore = useIrrigation();

  const calendar = useCalendar(cropId);
  const calendarData = calendar.data;
  const weather = useWeather();
  const weatherData = weather.data;
  const forecast = useForecast();
  const { forecastRows, isLoading: isForecastLoading } = forecast;
  const soilMoisture = useSoilMoisture(daysbefore);
  const { data: soilMoistureResponse, isLoading: isSoilLoading } = soilMoisture;

  // Construct the exact original VillageReportAPIResponse schema for AI backend compatibility
  const mockVillageReport: VillageReportAPIResponse | undefined = (forecastRows.length > 0 && location)
    ? {
        requested_lat: location.lat,
        requested_lon: location.lng,
        village_id: 12345,
        forecast: {
          success: true,
          location: {
            lat: location.lat,
            lon: location.lng,
            elevation_m: weatherData?.elevation || 0,
          },
          grids_used: [],
          forecast_source: "bias-corrected",
          forecast: forecastRows.map((row) => ({
            date: row.date,
            tmax_raw: row.tmax,
            tmax_corrected: row.tmax_corrected,
            tmin_raw: row.tmin,
            tmin_corrected: row.tmin_corrected,
            pcp_raw: row.pcp,
            pcp_corrected: row.pcp_corrected,
          })),
          runtime_seconds: 0,
        },
        soil_moisture: {
          success: true,
          location: {
            lat: location.lat,
            lon: location.lng,
          },
          cold_start: false,
          days_computed: soilMoistureResponse?.soil_moisture?.length || 0,
          checkpoint_last_date: "",
          soil_moisture: (soilMoistureResponse?.soil_moisture || []).map((row) => ({
            date: row.date,
            P_obs: row.P_obs ?? 0,
            Tmean: row.Tmean,
            PE: row.PE,
            P_eff: row.P_eff,
            snowpack: row.snowpack,
            w: row.w,
            E: row.E,
            R: row.R,
            G: row.G,
            w_frac: row.w_frac,
            sm_percentile: row.sm_percentile ?? 0,
            is_forecast: row.is_forecast,
          })),
          runtime_seconds: 0,
        },
        cache_hit: false,
        total_runtime_seconds: 0,
        cache_key: null,
      }
    : undefined;

  // Create a stable fingerprint of the forecast data to ensure cache uniqueness
  const forecastHash = forecastRows.length > 0
    ? forecastRows.map((d) => `${d.date}:${d.pcp_corrected}`).join(",")
    : "none";

  const query = useQuery<AIAPIResponse, Error>({
    queryKey: [
      "ai",
      location?.lat,
      location?.lng,
      cropId,
      language,
      forecastHash,
    ],
    queryFn: () => {
      if (!calendarData || !weatherData || !location) {
        throw new Error("Context data not available for AI generation");
      }
      return getAIAdvisory({
        location,
        cropId,
        calendarData,
        weatherData,
        forecastData: mockVillageReport,
        language,
      });
    },
    enabled:
      !isResolving &&
      !isForecastLoading &&
      !isSoilLoading &&
      !!location?.lat &&
      !!location?.lng &&
      !!cropId &&
      !!language &&
      !!calendarData &&
      !!weatherData,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-ai-loading"));
    } else if (query.data?.advisory_summary) {
      try {
        localStorage.setItem(
          "farmrisk-ai-advisory",
          query.data.advisory_summary,
        );
      } catch (e) {
        console.error("Failed to save AI advisory to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-ai-loaded", {
          detail: query.data.advisory_summary,
        }),
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data?.advisory_summary,
    sources: query.data?.sources || [],
    isLoading:
      isResolving ||
      !location ||
      calendar.isLoading ||
      weather.isLoading ||
      isForecastLoading ||
      isSoilLoading ||
      query.isLoading,
    isFetching:
      calendar.isFetching ||
      weather.isFetching ||
      forecast.isFetching ||
      soilMoisture.isFetching ||
      query.isFetching,
    error:
      query.error ||
      calendar.error ||
      (weather.isError
        ? new Error(weather.errorMessage || "Weather request failed")
        : null) ||
      soilMoisture.error,
    isError:
      query.isError ||
      calendar.isError ||
      weather.isError ||
      soilMoisture.isError,
    refetch: query.refetch,
  };
}
