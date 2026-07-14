"use client";

import { useEffect, useState } from "react";
import { usePro } from "@/hooks/usePro";

/**
 * Hook to manage and listen to reactive irrigation schedule changes.
 * Only returns the irrigated offset if the user is currently a "pro" subscriber.
 */
export function useIrrigation() {
  const { isPro } = usePro();
  const [daysBefore, setDaysBefore] = useState<number | undefined>(() => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem("irrigation_days_before");
      return val ? parseInt(val, 10) : undefined;
    }
    return undefined;
  });

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDaysBefore(detail);
    };

    window.addEventListener("farmrisk-irrigation-updated", handleUpdate);
    return () => {
      window.removeEventListener("farmrisk-irrigation-updated", handleUpdate);
    };
  }, []);

  return isPro ? daysBefore : undefined;
}
export default useIrrigation;
