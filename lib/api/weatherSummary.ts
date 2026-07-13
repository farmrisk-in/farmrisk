import { AIAdvisoryRequestPayload } from "@/types/ai";

export interface WeatherSummaryResponse {
  success: boolean;
  weather_summary: string;
  translated: boolean;
  language: string;
}

export async function getWeatherSummary(
  payload: AIAdvisoryRequestPayload
): Promise<WeatherSummaryResponse> {
  const res = await fetch("/api/ai/weather-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Weather summary request failed: ${res.statusText}`);
  }

  return res.json();
}
