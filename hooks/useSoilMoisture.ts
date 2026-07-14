"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSoilMoisture } from "@/lib/api/forecast";
import { useLocationContext } from "@/providers/LocationProvider";
import { SoilMoistureResponse, SoilMoistureRow } from "@/types/forecast";
import { useForecast } from "./useForecast";

export function useSoilMoisture(daysbefore?: number, crop?: string) {
  const { location, isResolving } = useLocationContext();
  const { isLoading: isForecastLoading, isSuccess: isForecastSuccess, forecastRows } = useForecast();

  const [currentCrop, setCurrentCrop] = useState("general");

  useEffect(() => {
    if (crop) {
      setCurrentCrop(crop);
      return;
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("farmrisk-selected-crop");
      if (stored) {
        try {
          setCurrentCrop(JSON.parse(stored).id);
        } catch {}
      }
    }

    const handleCropChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id) {
        setCurrentCrop(detail.id);
      }
    };
    window.addEventListener("farmrisk-crop-changed", handleCropChange);
    return () => {
      window.removeEventListener("farmrisk-crop-changed", handleCropChange);
    };
  }, [crop]);

  const query = useQuery<SoilMoistureRow[], Error>({
    queryKey: [
      "soil-moisture",
      location.lat,
      location.lng,
      currentCrop,
      daysbefore,
      isForecastSuccess,
    ],
    queryFn: () => {
      const cropParam = currentCrop && currentCrop !== "general" ? currentCrop : undefined;
      const daysbeforeParam = daysbefore && daysbefore > 0 ? daysbefore : undefined;
      return getSoilMoisture(
        location.lat,
        location.lng,
        cropParam,
        daysbeforeParam,
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
