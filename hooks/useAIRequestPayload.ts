"use client";

import { useLocationContext } from "@/providers/LocationProvider";
import { useCalendar } from "@/hooks/useCalendar";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { useIrrigation } from "@/hooks/useIrrigation";
import { AIAdvisoryRequestPayload } from "@/types/ai";
import { VillageReportAPIResponse } from "@/types/forecast";
import { OpenMeteoResponse } from "@/types/weather";
import { CalendarAPIResponse, CalendarEvent } from "@/types/calendar";

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeCalendar = (
  calendarData: CalendarAPIResponse,
): CalendarAPIResponse => {
  return {
    ...calendarData,
    calendar: calendarData.calendar.map((ev: CalendarEvent) => {
      const extra = ev as CalendarEvent & Record<string, unknown>;
      return {
        ...ev,
        sowFromMon: num(ev.sowFromMon),
        sowToMon: num(ev.sowToMon),
        harvFromMon: num(ev.harvFromMon),
        harvToMon: num(ev.harvToMon),
        sowFromDay: num(extra.sowFromDay),
        sowToDay: num(extra.sowToDay),
        harvFromDay: num(extra.harvFromDay),
        harvToDay: num(extra.harvToDay),
      };
    }),
  };
};

const sanitizeWeather = (w: OpenMeteoResponse): OpenMeteoResponse => ({
  ...w,
  latitude: num(w.latitude),
  longitude: num(w.longitude),
  elevation: num(w.elevation),
  utcOffsetSeconds: num(w.utcOffsetSeconds),
  current: {
    ...w.current,
    temperature_2m: num(w.current.temperature_2m),
    relative_humidity_2m: num(w.current.relative_humidity_2m),
    apparent_temperature: num(w.current.apparent_temperature),
    weather_code: num(w.current.weather_code),
    pressure_msl: num(w.current.pressure_msl),
    surface_pressure: num(w.current.surface_pressure),
    wind_speed_10m: num(w.current.wind_speed_10m),
    wind_direction_10m: num(w.current.wind_direction_10m),
    wind_gusts_10m: num(w.current.wind_gusts_10m),
    precipitation: num(w.current.precipitation),
    cloud_cover: num(w.current.cloud_cover),
  },
  hourly: {
    ...w.hourly,
    temperature_2m: w.hourly.temperature_2m.map(num),
    precipitation_probability: w.hourly.precipitation_probability.map(num),
    wind_speed_10m: w.hourly.wind_speed_10m.map(num),
    wind_gusts_10m: w.hourly.wind_gusts_10m.map(num),
    weather_code: w.hourly.weather_code.map(num),
    rain: w.hourly.rain.map(num),
  },
  daily: {
    ...w.daily,
    temperature_2m_max: w.daily.temperature_2m_max.map(num),
    temperature_2m_min: w.daily.temperature_2m_min.map(num),
    precipitation_sum: w.daily.precipitation_sum.map(num),
  },
  lightning: {
    score: num(w.lightning.score),
    category: w.lightning.category,
  },
});

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
            tmax_raw: num(row.tmax),
            tmax_corrected: num(row.tmax_corrected),
            tmin_raw: num(row.tmin),
            tmin_corrected: num(row.tmin_corrected),
            pcp_raw: num(row.pcp),
            pcp_corrected: num(row.pcp_corrected),
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
            P_obs: num(row.P_obs),
            Tmean: num(row.Tmean),
            PE: num(row.PE),
            P_eff: num(row.P_eff),
            snowpack: num(row.snowpack),
            w: num(row.w),
            E: num(row.E),
            R: num(row.R),
            G: num(row.G),
            w_frac: num(row.w_frac),
            sm_percentile: num(row.sm_percentile),
            is_forecast: num(row.is_forecast),
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
        calendarData: sanitizeCalendar(calendarData!),
        weatherData: sanitizeWeather(weatherData),
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
