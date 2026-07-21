/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UnifiedSearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  provider?: "ola" | "locationiq" | "nominatim";
}

export interface UnifiedReverseResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  state?: string;
  district?: string;
  provider?: "ola" | "locationiq" | "nominatim";
}

// -------------------------------------------------------------
// Helper: Timeout-bounded fetch to prevent hanging requests
// -------------------------------------------------------------
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function buildVillageLabelFromAddress(
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  },
  defaultName?: string,
): string {
  if (!address) return defaultName || "";
  const mainPart = address.village ?? address.town ?? address.city;
  const parts = [
    mainPart,
    address.county ?? address.state_district,
    address.state,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : defaultName || "";
}

// =============================================================
// PROVIDER 1: OLA MAPS API
// =============================================================

interface OlaAutocompletePrediction {
  place_id?: string;
  description?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  location?: {
    lat?: number;
    lng?: number;
  };
}

async function fetchOlaPlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://api.olamaps.io/places/v1/details?place_id=${encodeURIComponent(
      placeId,
    )}&api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetchWithTimeout(url, {
      headers: { "X-Request-Id": "farmrisk-search" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data.result?.geometry?.location || data.result?.location;
    if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
      return { lat: loc.lat, lng: loc.lng };
    }
    return null;
  } catch {
    return null;
  }
}

async function searchOlaMaps(
  query: string,
  apiKey: string,
): Promise<UnifiedSearchResult[]> {
  const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
    query,
  )}&api_key=${encodeURIComponent(apiKey)}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "X-Request-Id": "farmrisk-search",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const predictions: OlaAutocompletePrediction[] = data.predictions || [];

  if (!predictions.length) return [];

  const results: UnifiedSearchResult[] = [];

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i];
    const mainText =
      pred.structured_formatting?.main_text || pred.description || query;
    const secondaryText = pred.structured_formatting?.secondary_text || "";
    const name = secondaryText ? `${mainText}, ${secondaryText}` : mainText;
    const displayName = pred.description || name;
    const placeId = pred.place_id || `ola-${i}`;

    let lat = pred.geometry?.location?.lat ?? pred.location?.lat;
    let lng = pred.geometry?.location?.lng ?? pred.location?.lng;

    // If geometry missing from prediction, attempt details lookup
    if ((lat === undefined || lng === undefined) && pred.place_id) {
      const details = await fetchOlaPlaceDetails(pred.place_id, apiKey);
      if (details) {
        lat = details.lat;
        lng = details.lng;
      }
    }

    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng)
    ) {
      results.push({
        id: placeId,
        name,
        displayName,
        lat,
        lng,
        provider: "ola",
      });
    }
  }

  return results;
}

async function reverseGeocodeOlaMaps(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<UnifiedReverseResult | null> {
  const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${encodeURIComponent(
    apiKey,
  )}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "X-Request-Id": "farmrisk-reverse",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = data.results || [];
  if (!results.length) return null;

  const topResult = results[0];
  const displayName =
    topResult.formatted_address || topResult.name || "Selected Location";
  const name =
    topResult.name || displayName.split(",")[0] || "Selected Location";

  let state: string | undefined;
  let district: string | undefined;

  if (Array.isArray(topResult.address_components)) {
    for (const comp of topResult.address_components) {
      const types: string[] = comp.types || [];
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      } else if (
        types.includes("administrative_area_level_2") ||
        types.includes("locality") ||
        types.includes("district")
      ) {
        if (!district) district = comp.long_name;
      }
    }
  }

  return {
    name,
    displayName,
    lat,
    lng,
    state,
    district,
    provider: "ola",
  };
}

// =============================================================
// PROVIDER 2: LOCATIONIQ API
// =============================================================

interface LocationIQItem {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
}

async function searchLocationIQ(
  query: string,
  apiKey: string,
): Promise<UnifiedSearchResult[]> {
  const url = new URL("https://us1.locationiq.com/v1/autocomplete");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "in");

  const response = await fetchWithTimeout(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as LocationIQItem[];
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    id: String(item.place_id),
    name: buildVillageLabelFromAddress(item.address, item.display_name),
    displayName: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    provider: "locationiq",
  }));
}

async function reverseGeocodeLocationIQ(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<UnifiedReverseResult | null> {
  const url = new URL("https://us1.locationiq.com/v1/reverse");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const response = await fetchWithTimeout(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const item = (await response.json()) as LocationIQItem;
  const address = item.address;

  return {
    name: buildVillageLabelFromAddress(address, item.display_name),
    displayName: item.display_name,
    lat,
    lng,
    state: address?.state,
    district: address?.county ?? address?.state_district ?? address?.city,
    provider: "locationiq",
  };
}

// =============================================================
// PROVIDER 3: NOMINATIM (CURRENT SYSTEM FALLBACK)
// =============================================================

interface NominatimSearchItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
}

async function searchNominatim(query: string): Promise<UnifiedSearchResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("q", query);

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": "farmrisk-dashboard/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as NominatimSearchItem[];
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    id: String(item.place_id),
    name: buildVillageLabelFromAddress(item.address, item.display_name),
    displayName: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    provider: "nominatim",
  }));
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<UnifiedReverseResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      "User-Agent": "farmrisk-dashboard/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const item = (await response.json()) as NominatimSearchItem;
  const address = item.address;

  return {
    name: buildVillageLabelFromAddress(address, item.display_name),
    displayName: item.display_name,
    lat,
    lng,
    state: address?.state,
    district: address?.county ?? address?.state_district ?? address?.city,
    provider: "nominatim",
  };
}

// =============================================================
// UNIFIED SEARCH & REVERSE GEOCODE WITH FALLBACK CHAIN & LOGS
// =============================================================

export async function searchLocationsWithFallback(
  query: string,
): Promise<UnifiedSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const olaApiKey = process.env.OLA_MAPS_API_KEY;
  const locationIqApiKey = process.env.LOCATIONIQ_API_KEY;

  // 1. Try Ola Maps
  if (olaApiKey) {
    try {
      const results = await searchOlaMaps(trimmed, olaApiKey);
      if (results.length > 0) {
        return results;
      }
    } catch (error: any) {
      console.warn(
        `[LocationService] Primary Provider (Ola Maps) failed: ${error?.message || error}. Falling back to LocationIQ...`,
      );
    }
  } else {
    console.warn(
      `[LocationService] OLA_MAPS_API_KEY not configured in .env. Skipping Ola Maps.`,
    );
  }

  // 2. Try LocationIQ
  if (locationIqApiKey) {
    try {
      const results = await searchLocationIQ(trimmed, locationIqApiKey);
      if (results.length > 0) {
        return results;
      }
      console.warn(
        `[LocationService] LocationIQ returned 0 results for "${trimmed}". Proceeding to Fallback 2...`,
      );
    } catch (error: any) {
      console.warn(
        `[LocationService] Fallback 1 Provider (LocationIQ) failed: ${error?.message || error}. Falling back to Nominatim...`,
      );
    }
  } else {
    console.warn(
      `[LocationService] LOCATIONIQ_API_KEY not configured in .env. Skipping LocationIQ.`,
    );
  }

  // 3. Final Fallback: Nominatim
  try {
    const results = await searchNominatim(trimmed);
    return results;
  } catch (error: any) {
    console.error(
      `[LocationService] All location search providers failed:`,
      error?.message || error,
    );
    return [];
  }
}

export async function reverseGeocodeWithFallback(
  lat: number,
  lng: number,
): Promise<UnifiedReverseResult> {
  const olaApiKey = process.env.OLA_MAPS_API_KEY;
  const locationIqApiKey = process.env.LOCATIONIQ_API_KEY;

  // 1. Try Ola Maps
  if (olaApiKey) {
    try {
      const result = await reverseGeocodeOlaMaps(lat, lng, olaApiKey);
      if (result) {
        return result;
      }
      console.warn(
        `[LocationService] Ola Maps reverse geocode returned empty. Proceeding to Fallback 1...`,
      );
    } catch (error: any) {
      console.warn(
        `[LocationService] Primary Provider (Ola Maps) reverse geocode failed: ${error?.message || error}. Falling back to LocationIQ...`,
      );
    }
  } else {
    console.warn(
      `[LocationService] OLA_MAPS_API_KEY not configured in .env. Skipping Ola Maps.`,
    );
  }

  // 2. Try LocationIQ
  if (locationIqApiKey) {
    try {
      const result = await reverseGeocodeLocationIQ(lat, lng, locationIqApiKey);
      if (result) {
        return result;
      }
      console.warn(
        `[LocationService] LocationIQ reverse geocode returned empty. Proceeding to Fallback 2...`,
      );
    } catch (error: any) {
      console.warn(
        `[LocationService] Fallback 1 Provider (LocationIQ) reverse geocode failed: ${error?.message || error}. Falling back to Nominatim...`,
      );
    }
  } else {
    console.warn(
      `[LocationService] LOCATIONIQ_API_KEY not configured in .env. Skipping LocationIQ.`,
    );
  }

  // 3. Final Fallback: Nominatim

  try {
    const result = await reverseGeocodeNominatim(lat, lng);
    return result;
  } catch (error: any) {
    console.error(
      `[LocationService] All reverse geocode providers failed:`,
      error?.message || error,
    );
    return {
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      displayName: "Selected Location",
      lat,
      lng,
      provider: "nominatim",
    };
  }
}
