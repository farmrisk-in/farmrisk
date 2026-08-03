"use client";

import { useQuery } from "@tanstack/react-query";
import { getCrops } from "@/lib/api/crops";
import { useLocationContext } from "@/providers/LocationProvider";
import { CropsAPIResponse, GENERAL_CROP, Crop } from "@/types/crops";

export function useCrop(override?: { lat: number; lng: number }) {
  const { location, isResolving } = useLocationContext();

  const lat = override?.lat ?? location?.lat;
  const lng = override?.lng ?? location?.lng;

  const query = useQuery<CropsAPIResponse, Error>({
    queryKey: ["crop", lat, lng],
    queryFn: () => getCrops(lat!, lng!),
    enabled:
      lat != null && lng != null && (override ? true : !isResolving),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Prepend GENERAL_CROP to the regional crops list
  const crops: Crop[] = query.data?.crops && query.data.crops.length > 0
    ? [GENERAL_CROP, ...query.data.crops]
    : [GENERAL_CROP];

  return {
    data: query.data,
    crops,
    isLoading: (override ? false : isResolving || !location) || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
