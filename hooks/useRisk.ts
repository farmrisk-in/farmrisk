"use client";

import { useQuery } from "@tanstack/react-query";
import { getRiskScores, type RiskAPIResponse } from "@/lib/api/risk";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { useLocationContext } from "@/providers/LocationProvider";

/**
 * useRisk
 *
 * Computes all six agricultural risk scores (heavy_rain, heat_stress, pest,
 * lightning, wind, frost) plus an overall score.
 *
 * Data flow:
 *   useForecast()     → BIAS-CORRECTED rainfall (pcp_corrected) and temperatures
 *                       (tmax_corrected, tmin_corrected)
 *   useSoilMoisture() → soil moisture percentile (antecedent wetness amplifier)
 *   useWeather()      → current humidity, wind speed/gusts, lightning score,
 *                       and hourly wind gusts
 */
export function useRisk(station_type: "plains" | "hilly" | "coastal" = "plains") {
  const { location, isResolving } = useLocationContext();
  const { data: weatherData, isLoading: isWeatherLoading } = useWeather();
  const { forecastRows, isLoading: isForecastLoading } = useForecast();
  const { data: soilData, isLoading: isSoilLoading } = useSoilMoisture();

  // ---- derive soil percentile from the most recent historical row ----
  const soilRows = soilData?.soil_moisture ?? [];
  const latestHistoricalRow = [...soilRows]
    .filter((r) => r.is_forecast === 0)
    .at(-1);
  const soil_percentile = latestHistoricalRow?.sm_percentile ?? null;
  const soil_moisture_available = soil_percentile !== null;

  // ---- derive BIAS-CORRECTED rain and temperature inputs from useForecast() ----
  // Take the next 5 days from forecastRows
  const next5Rows = forecastRows.slice(0, 5);

  const rain_next5 =
    next5Rows.length > 0
      ? next5Rows.map((r) => r.pcp_corrected ?? r.pcp ?? 0)
      : weatherData?.daily?.precipitation_sum?.slice(0, 5) ?? null;

  const rain_dates =
    next5Rows.length > 0
      ? next5Rows.map((r) => r.date)
      : weatherData?.daily?.time
          ?.slice(0, 5)
          .map((t) => new Date(t).toISOString().slice(0, 10)) ?? null;

  const max_temp =
    next5Rows.length > 0
      ? (next5Rows[0]?.tmax_corrected ?? next5Rows[0]?.tmax ?? null)
      : (weatherData?.daily?.temperature_2m_max?.[0] ?? null);

  const min_temp =
    next5Rows.length > 0
      ? (next5Rows[0]?.tmin_corrected ?? next5Rows[0]?.tmin ?? null)
      : (weatherData?.daily?.temperature_2m_min?.[0] ?? null);

  const avg_max_temp =
    next5Rows.length > 0
      ? next5Rows.reduce(
          (sum, r) => sum + (r.tmax_corrected ?? r.tmax ?? 0),
          0
        ) / next5Rows.length
      : weatherData?.daily?.temperature_2m_max &&
        weatherData.daily.temperature_2m_max.length > 0
      ? weatherData.daily.temperature_2m_max.reduce((a, b) => a + b, 0) /
        weatherData.daily.temperature_2m_max.length
      : null;

  const avg_min_temp =
    next5Rows.length > 0
      ? next5Rows.reduce(
          (sum, r) => sum + (r.tmin_corrected ?? r.tmin ?? 0),
          0
        ) / next5Rows.length
      : weatherData?.daily?.temperature_2m_min &&
        weatherData.daily.temperature_2m_min.length > 0
      ? weatherData.daily.temperature_2m_min.reduce((a, b) => a + b, 0) /
        weatherData.daily.temperature_2m_min.length
      : null;

  // ---- derive current & real-time weather inputs from useWeather() ----
  const current = weatherData?.current;
  const hourly = weatherData?.hourly;
  const lightning = weatherData?.lightning;

  // Current conditions
  const humidity = current?.relative_humidity_2m ?? null;
  const wind_gusts = current?.wind_gusts_10m ?? null;
  const wind_speed = current?.wind_speed_10m ?? null;

  // Lightning
  const lightning_score = lightning?.score ?? null;
  const lightning_category = lightning?.category ?? null;

  // Hourly wind gusts from the 24-hour forecast window
  const gusts_hourly = hourly?.wind_gusts_10m ?? null;
  const times_hourly =
    hourly?.time?.map((t) => new Date(t).toISOString()) ?? null;

  // ---- stable cache key fingerprint ----
  const rainHash = rain_next5?.map((v) => v?.toFixed(1)).join(",") ?? "none";
  const tempHash = `${max_temp?.toFixed(1) ?? "none"}_${min_temp?.toFixed(1) ?? "none"}`;

  const payload = {
    rain_next5,
    rain_dates,
    max_temp,
    min_temp,
    avg_max_temp,
    avg_min_temp,
    humidity,
    wind_gusts,
    wind_speed,
    lightning_score,
    lightning_category,
    gusts_hourly,
    times_hourly,
    soil_moisture_available,
    soil_percentile,
    station_type,
  };

  const query = useQuery<RiskAPIResponse, Error>({
    queryKey: [
      "risk",
      location?.lat,
      location?.lng,
      rainHash,
      tempHash,
      soil_percentile,
      station_type,
    ],
    queryFn: () => getRiskScores(payload),
    enabled:
      !isResolving &&
      !isWeatherLoading &&
      !isForecastLoading &&
      !!location &&
      (next5Rows.length > 0 || !!weatherData),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading:
      isResolving ||
      !location ||
      isWeatherLoading ||
      isForecastLoading ||
      isSoilLoading ||
      query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useRisk;
