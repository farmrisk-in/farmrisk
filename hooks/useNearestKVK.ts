"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocationContext } from "@/providers/LocationProvider";
import { NearestKVKResult } from "@/lib/services/kvkService";

export function useNearestKVK() {
  const { location, isResolving } = useLocationContext();

  const lat = location?.lat;
  const lon = location?.lng;

  const query = useQuery<NearestKVKResult>({
    queryKey: ["nearest-kvk", lat, lon],
    queryFn: async () => {
      if (lat === undefined || lon === undefined) {
        throw new Error("Missing coordinates for KVK query");
      }
      const res = await fetch(`/api/kvk?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch nearest KVK");
      }
      return res.json();
    },
    enabled: !isResolving && lat !== undefined && lon !== undefined,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  });

  return {
    ...query,
    kvkData: query.data,
  };
}
