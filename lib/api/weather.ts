import { OpenMeteoResponse } from "@/types/weather";

export async function getWeather(
  lat: number,
  lng: number,
): Promise<OpenMeteoResponse> {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.statusText}`);
  }
  return res.json();
}
