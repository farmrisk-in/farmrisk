"use client";

import { useQuery } from "@tanstack/react-query";
import { getCrops } from "@/lib/api/crops";
import { useLocationContext } from "@/providers/LocationProvider";
import { CropsAPIResponse, GENERAL_CROP, Crop } from "@/types/crops";

export function useCrop() {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<CropsAPIResponse, Error>({
    queryKey: ["crop", location.lat, location.lng],
    queryFn: () => getCrops(location.lat, location.lng),
    enabled: !isResolving && !!location.lat && !!location.lng,
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
    isLoading: isResolving || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
