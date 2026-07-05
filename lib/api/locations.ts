export interface SearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

export async function searchLocations(q: string): Promise<SearchResult[]> {
  const res = await fetch(`/api/locations?mode=search&q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    throw new Error(`Location search failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.results;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const res = await fetch(`/api/locations?mode=reverse&lat=${lat}&lon=${lng}`);
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: ${res.statusText}`);
  }
  return res.json();
}
