"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCalendar } from "@/lib/api/calendar";
import { useLocationContext } from "@/providers/LocationProvider";
import { CalendarAPIResponse } from "@/types/calendar";

export function useCalendar(cropId: string) {
  const { location, isResolving } = useLocationContext();

  const query = useQuery<CalendarAPIResponse, Error>({
    queryKey: ["calendar", cropId, location.lat, location.lng],
    queryFn: () => getCalendar(cropId, location.lat, location.lng),
    enabled: !isResolving && !!location.lat && !!location.lng && !!cropId,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  useEffect(() => {
    if (query.isFetching && !query.data) {
      window.dispatchEvent(new CustomEvent("farmrisk-calendar-loading"));
    } else if (query.data?.success) {
      try {
        localStorage.setItem(
          "farmrisk-crop-calendar",
          JSON.stringify(query.data.calendar)
        );
      } catch (e) {
        console.error("Failed to save calendar data to localStorage", e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-calendar-loaded", {
          detail: query.data.calendar,
        })
      );
    }
  }, [query.data, query.isFetching]);

  return {
    data: query.data,
    isLoading: isResolving || query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isError: query.isError,
    refetch: query.refetch,
  };
}
