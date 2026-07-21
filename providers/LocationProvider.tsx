"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { reverseGeocode } from "@/lib/utils";

export type SelectedLocation = {
  lat: number;
  lng: number;
  name: string;
  displayName: string;
};

type LocationContextValue = {
  location: SelectedLocation | null;
  setLocation: (location: SelectedLocation) => void;
  isResolving: boolean;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    // Request GPS location on mount; if denied or unavailable, location stays null until user searches or picks on map
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const geoResult = await reverseGeocode(latitude, longitude);
            setLocation({
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
