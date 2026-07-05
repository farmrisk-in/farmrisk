"use client";

import { useQuery } from "@tanstack/react-query";
import { reverseGeocode, searchLocations, SearchResult, ReverseGeocodeResult } from "@/lib/api/locations";

export function useReverseGeocode(lat: number | null, lng: number | null) {
  const enabled = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  const query = useQuery<ReverseGeocodeResult, Error>({
    queryKey: ["location", lat, lng],
    queryFn: () => reverseGeocode(lat!, lng!),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return query;
}

export function useLocationSearch(q: string) {
  const trimmed = q.trim();
  const enabled = trimmed.length >= 2;

  const query = useQuery<SearchResult[], Error>({
    queryKey: ["location", "search", trimmed],
    queryFn: () => searchLocations(trimmed),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return query;
}
