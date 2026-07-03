import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const TILE_SIZE = 256;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clampLatitude(lat: number) {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

export function normalizeLongitude(lng: number) {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}

export function project(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((clampLatitude(lat) * Math.PI) / 180);
  return {
    x: ((normalizeLongitude(lng) + 180) / 360) * scale,
    y:
      ((1 - Math.log((1 + sinLat) / (1 - sinLat)) / (2 * Math.PI)) / 2) * scale,
  };
}

export function unproject(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return {
    lat: clampLatitude(lat),
    lng: normalizeLongitude(lng),
  };
}

export function formatCoordinates(lat: number, lng: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lngHemisphere = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)} ${latHemisphere}, ${Math.abs(lng).toFixed(4)} ${lngHemisphere}`;
}

export async function reverseGeocode(lat: number, lng: number) {
  const url = new URL("/api/locations", window.location.origin);
  url.searchParams.set("mode", "reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  return (await response.json()) as {
    name: string;
    displayName: string;
    lat: number;
    lng: number;
  };
}

/**
 * Formats a raw user count into a stylized, rounded social proof string for the Hero page.
 * Rules:
 * - Less than 100 -> "100"
 * - 100 to 999   -> Snap to lower 10s (e.g., 854 -> "850+")
 * - 1,000 to 9,999 -> Snap to lower 100s, convert to K (e.g., 4,321 -> "4.3K+")
 * - 10,000 to 999,999 -> Snap to lower 1,000s, convert to K (e.g., 27,850 -> "27K+")
 * - 1,000,000+   -> Snap to lower 100,000s, convert to M (e.g., 2,450,000 -> "2.4M+")
 */
export function formatHeroUserCount(count: number): {
  userCountRounded: string;
  suffix: string;
} {
  if (count < 100) {
    return { userCountRounded: count.toString(), suffix: "+" };
  }

  if (count < 1000) {
    const rounded = Math.floor(count / 10) * 10;
    return {
      userCountRounded: String(rounded),
      suffix: "+",
    };
  }

  if (count < 10000) {
    const rounded = Math.floor(count / 100) * 100;
    return {
      userCountRounded: String(rounded / 1000),
      suffix: "K+",
    };
  }

  if (count < 1000000) {
    const rounded = Math.floor(count / 1000);
    return {
      userCountRounded: String(rounded),
      suffix: "K+",
    };
  }

  // Handles 1,000,000 (Millions) and up gracefully
  // e.g., Math.floor(2,450,000 / 100,000) * 100,000 = 2,400,000 -> / 1,000,000 = 2.4
  const rounded = Math.floor(count / 100000) * 100000;

  // Clean up potential trailing decimal zero bugs (e.g., 2.0M+ becomes 2M+)
  const formattedNumber = String(Number((rounded / 1000000).toFixed(1)));

  return {
    userCountRounded: formattedNumber,
    suffix: "M+",
  };
}
