import { RiskScores } from "@/app/api/risk/riskScores";

export interface RiskRequestPayload {
  // From /api/weather → daily (next 5 days)
  rain_next5?: number[] | null;
  rain_dates?: string[] | null;

  // From /api/weather → daily (computed)
  max_temp?: number | null;
  min_temp?: number | null;
  avg_max_temp?: number | null;
  avg_min_temp?: number | null;

  // From /api/weather → current
  humidity?: number | null;
  wind_gusts?: number | null;
  wind_speed?: number | null;
  lightning_score?: number | null;
  lightning_category?: string | null;

  // From /api/weather → hourly
  gusts_hourly?: number[] | null;
  times_hourly?: string[] | null;

  // From /api/soil-moisture
  soil_moisture_available?: boolean;
  soil_percentile?: number | null;

  // Optional overrides
  station_type?: "plains" | "hilly" | "coastal";
  crop_heat_threshold?: number | null;
}

export interface RiskAPIResponse {
  success: boolean;
  overall: RiskScores["overall"];
  heavy_rain: RiskScores["heavy_rain"];
  heat_stress: RiskScores["heat_stress"];
  pest: RiskScores["pest"];
  lightning: RiskScores["lightning"];
  wind: RiskScores["wind"];
  frost: RiskScores["frost"];
}

export async function getRiskScores(
  payload: RiskRequestPayload,
): Promise<RiskAPIResponse> {
  const res = await fetch("/api/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Risk scores request failed: ${res.statusText}`);
  }

  return res.json();
}
