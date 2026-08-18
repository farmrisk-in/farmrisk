"use client";

import { useLocationContext } from "@/providers/LocationProvider";
import { useCalendar } from "@/hooks/useCalendar";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { useIrrigation } from "@/hooks/useIrrigation";
import { AIAdvisoryRequestPayload } from "@/types/ai";
import { VillageReportAPIResponse } from "@/types/forecast";

/**
 * Shared builder for the exact backend advisory payload (location + crop +
 * calendar + weather + bias-corrected forecast + soil moisture). Used by both
 * the text advisory (`useAI`) and the crop-specific Pest & Disease card
 * (`usePestDisease`) so both hit the same context and the same RAG pipeline.
 *
 * Also exposes the readiness flags (`isDataReady`, `isLoading`) and a stable
 * `forecastHash` fingerprint for cache-key uniqueness.
 */
export function useAIRequestPayload(cropId: string, language: string) {
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
            pcp_raw: row.pcp ?? 0,
            pcp_corrected: row.pcp_corrected ?? 0,
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

  const isDataReady =
    !isResolving &&
    !isForecastLoading &&
    !isSoilLoading &&
    !!location?.lat &&
    !!location?.lng &&
    !!cropId &&
    !!language &&
    !!calendarData &&
    !!weatherData;

  const isLoading =
    isResolving ||
    !location ||
    calendar.isLoading ||
    weather.isLoading ||
    isForecastLoading ||
    isSoilLoading;

  const payload: AIAdvisoryRequestPayload | undefined = isDataReady
    ? {
        location,
        cropId,
        calendarData,
        weatherData,
        forecastData: mockVillageReport,
        language,
      }
    : undefined;

  return {
    payload,
    location,
    isDataReady,
    calendarData,
    weatherData,
    mockVillageReport,
    isLoading,
    isFetching:
      calendar.isFetching ||
      weather.isFetching ||
      forecast.isFetching ||
      soilMoisture.isFetching,
    forecastHash,
    errors: {
      calendar: calendar.error,
      weather: weather.isError
        ? new Error(weather.errorMessage || "Weather request failed")
        : null,
    },
  };
}
