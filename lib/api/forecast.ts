import { ForecastRow, SoilMoistureRow } from "@/types/forecast";

/**
 * Fetch bias-corrected weather forecast.
 */
export async function getForecast(
  lat: number,
  lon: number,
): Promise<ForecastRow[]> {
  const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Forecast correction failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch soil moisture forecast.
 */
export async function getSoilMoisture(
  lat: number,
  lon: number,
  daysbefore?: number,
): Promise<SoilMoistureRow[]> {
  let url = `/api/soil-moisture?lat=${lat}&lon=${lon}`;
  if (daysbefore !== undefined && daysbefore !== null) {
    url += `&daysbefore=${daysbefore}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Soil moisture forecast failed: ${res.statusText}`);
  }

  return res.json();
}
