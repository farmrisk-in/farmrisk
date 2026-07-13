"use client";

import { useQuery } from "@tanstack/react-query";
import { getSoilMoisture } from "@/lib/api/forecast";
import { useLocationContext } from "@/providers/LocationProvider";
import { SoilMoistureResponse, SoilMoistureRow } from "@/types/forecast";
import { useForecast } from "./useForecast";

export function useSoilMoisture(daysbefore?: number) {
  const { location, isResolving } = useLocationContext();
  const { isLoading: isForecastLoading, isSuccess: isForecastSuccess, forecastRows } = useForecast();

  const query = useQuery<SoilMoistureRow[], Error>({
    queryKey: [
      "soil-moisture",
      location.lat,
      location.lng,
      daysbefore,
      isForecastSuccess,
    ],
    queryFn: () => {
      return getSoilMoisture(
        location.lat,
        location.lng,
        daysbefore,
      );
    },
    // Gated: only execute after forecast succeeds (ensuring forecast model file is generated)
    enabled: !isResolving && !!location.lat && !!location.lng && isForecastSuccess && forecastRows.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 70 * 60 * 1000, // 70 minutes
  });

  // Construct wrapped backward-compatible SoilMoistureResponse structure
  const wrappedResponse: SoilMoistureResponse | undefined = query.data
    ? {
        success: true,
        location: { lat: location.lat, lon: location.lng },
        cold_start: false,
        history_days: 30,
        forecast_days: 16,
        days_computed: query.data.length,
        checkpoint_last_date: "",
        soil_moisture: query.data,
        runtime: { total_seconds: 0 },
      }
    : undefined;

  return {
    data: wrappedResponse,
    // Stay in loading state until forecast completes and soil moisture completes
    isLoading: isForecastLoading || query.isLoading || !isForecastSuccess,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
export default useSoilMoisture;
