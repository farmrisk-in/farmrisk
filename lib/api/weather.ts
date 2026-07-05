import { WeatherPayload } from "@/types/weather";

export async function getWeather(lat: number, lng: number): Promise<WeatherPayload> {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

  if (!res.ok) {
    throw new Error(`Weather request failed: ${res.statusText}`);
  }

  return res.json();
}
