"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GENERAL_CROP } from "@/types/crops";
import { useLocationContext } from "@/providers/LocationProvider";
import type { Crop } from "@/types/crops";

/**
 * Shared, single source of truth for the currently selected crop.
 *
 * Persists the selection to localStorage and broadcasts it via the
 * "farmrisk-crop-changed" CustomEvent so every consumer (Greeting,
 * AIOverview, CropCalendar, Download, …) stays in sync without
 * duplicating state across pages.
 */
export function useSelectedCrop() {
  const { location } = useLocationContext();

  const [selectedCrop, setSelectedCropState] = useState<Crop>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("farmrisk-selected-crop");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return GENERAL_CROP;
  });

  const setSelectedCrop = useCallback((crop: Crop) => {
    setSelectedCropState(crop);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("farmrisk-selected-crop", JSON.stringify(crop));
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-crop-changed", { detail: crop }),
      );
    }
  }, []);

  // Keep every hook instance in sync when the crop is changed from anywhere
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleCropChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as Crop | undefined;
      if (detail && detail.id) {
        setSelectedCropState(detail);
      }
    };
    window.addEventListener("farmrisk-crop-changed", handleCropChange);
    return () => {
      window.removeEventListener("farmrisk-crop-changed", handleCropChange);
    };
  }, []);

  // Reset back to the general crop whenever the *unlinked* location changes.
  // Locations that come from a saved field (`fieldId`) carry the field's own
  // current crop, which the location picker sets explicitly — resetting here
  // would overwrite it with the general crop.
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(
    location && !location.fieldId ? { lat: location.lat, lng: location.lng } : null,
  );

  useEffect(() => {
    if (!location || location.fieldId) return;
    if (
      !lastLocationRef.current ||
      lastLocationRef.current.lat !== location.lat ||
      lastLocationRef.current.lng !== location.lng
    ) {
      lastLocationRef.current = { lat: location.lat, lng: location.lng };
      setSelectedCrop(GENERAL_CROP);
    }
  }, [location, location?.lat, location?.lng, setSelectedCrop]);

  return { selectedCrop, setSelectedCrop };
}

export default useSelectedCrop;
