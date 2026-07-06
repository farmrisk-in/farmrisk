import {
  ForecastRequestPayload,
  VillageReportAPIResponse,
  ForecastDataDaily,
} from "@/types/forecast";

export async function getForecast(
  lat: number,
  lng: number,
  forecastData?: ForecastDataDaily,
): Promise<VillageReportAPIResponse> {
  const body: ForecastRequestPayload = {
    lat,
    lon: lng,
    village_id: 12345,
  };

  if (forecastData) {
    body.forecast_data = {
      daily: forecastData,
    };
  }

  const res = await fetch(`/api/forecast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Forecast request failed: ${res.statusText}`);
  }

  return res.json();
}
