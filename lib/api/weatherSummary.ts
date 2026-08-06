import { AIAdvisoryRequestPayload } from "@/types/ai";

export interface WeatherSummaryResponse {
  success: boolean;
  weather_summary: string;
  translated: boolean;
  language: string;
}

const DEFAULT_TIMEOUT_MS = 30000;

export async function getWeatherSummary(
  payload: AIAdvisoryRequestPayload,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<WeatherSummaryResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res: Response;
    try {
      res = await fetch("/api/ai/weather-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        throw new Error("Weather summary request timed out");
      }
      throw new Error(
        "Network error while loading weather summary. Please check your connection.",
      );
    }

    if (!res.ok) {
      throw new Error(
        `Weather summary request failed (${res.status} ${res.statusText})`,
      );
    }

    let data: WeatherSummaryResponse;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from weather summary service");
    }

    const summary = data?.weather_summary?.trim();
    if (!data?.success || !summary) {
      throw new Error("Weather summary is currently unavailable");
    }

    return { ...data, weather_summary: summary };
  } finally {
    clearTimeout(timeout);
  }
}