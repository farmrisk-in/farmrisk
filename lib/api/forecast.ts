import { ForecastAPIResponse } from "@/types/forecast";

export async function getForecast(
  lat: number,
  lng: number,
  villageID: string,
): Promise<ForecastAPIResponse> {
  const res = await fetch(
    `/api/forecast?lat=${lat}&lon=${lng}&village_id=${villageID}`,
  );

  if (!res.ok) {
    throw new Error(`Forecast request failed: ${res.statusText}`);
  }

  return res.json();
}
