"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { reverseGeocode } from "@/lib/utils";

export type SelectedLocation = {
  lat: number;
  lng: number;
  name: string;
  displayName: string;
  /** When the location was picked from a saved field, the saved_fields row id. */
  fieldId?: string;
};

type LocationContextValue = {
  location: SelectedLocation | null;
  setLocation: (location: SelectedLocation) => void;
  isResolving: boolean;
};

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = "farmrisk-location";

function readStoredLocation(): SelectedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedLocation;
    return Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<SelectedLocation | null>(
    null,
  );
  const [isResolving, setIsResolving] = useState(true);

  // A place the user picked (search, map, saved field, GPS button) is
  // remembered across reloads; GPS on load is only used when nothing is saved.
  const setLocation = useCallback((next: SelectedLocation) => {
    setLocationState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode etc.) - keep the in-memory value.
    }
  }, []);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationState(stored);
      setIsResolving(false);
      return;
    }

    // Request GPS location on mount; if denied or unavailable, location stays null until user searches or picks on map
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const geoResult = await reverseGeocode(latitude, longitude);
            setLocationState({
              lat: geoResult.lat,
              lng: geoResult.lng,
              name: geoResult.name,
              displayName: geoResult.displayName,
            });
          } catch (error) {
            console.error(
              "Failed to reverse-geocode GPS location on load:",
              error,
            );
          } finally {
            setIsResolving(false);
          }
        },
        (error) => {
          console.warn("User geolocation denied or failed on load:", error);
          setIsResolving(false);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 86400000 },
      );
    } else {
      setIsResolving(false);
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, isResolving }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error(
      "useLocationContext must be used inside <LocationProvider>",
    );
  }
  return ctx;
}
