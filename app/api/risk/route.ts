import { NextRequest, NextResponse } from "next/server";
import { computeRiskScores, type ComputeRiskInput } from "./riskScores";

/**
 * POST /api/risk
 *
 * Accepts a JSON body that maps directly from the weather API response
 * (plus optional soil moisture data) and returns six deterministic risk scores.
 *
 * Body shape (all fields optional):
 * {
 *   // From /api/weather  → daily
 *   rain_next5:        number[]   // daily.precipitation_sum (next 5 days)
 *   rain_dates:        string[]   // daily.time as ISO strings  (next 5 days)
 *   max_temp:          number     // daily.temperature_2m_max[0]  (today)
 *   min_temp:          number     // daily.temperature_2m_min[0]  (today)
 *   avg_max_temp:      number     // mean of daily.temperature_2m_max over window
 *   avg_min_temp:      number     // mean of daily.temperature_2m_min over window
 *
 *   // From /api/weather → current
 *   humidity:          number     // current.relative_humidity_2m
 *   wind_gusts:        number     // current.wind_gusts_10m
 *   wind_speed:        number     // current.wind_speed_10m
 *   lightning_score:   number     // lightning.score
 *   lightning_category:string     // lightning.category
 *
 *   // From /api/weather → hourly
 *   gusts_hourly:      number[]   // hourly wind gusts (km/h) — not in weather API yet (see docs)
 *   times_hourly:      string[]   // matching ISO timestamps  — not in weather API yet
 *
 *   // From /api/soil-moisture
 *   soil_moisture_available: boolean
 *   soil_percentile:   number
 *
 *   // Optional overrides
 *   station_type:      "plains" | "hilly" | "coastal"  (default: "plains")
 *   crop_heat_threshold: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input: ComputeRiskInput = {
      rain_next5: body.rain_next5 ?? null,
      rain_dates: body.rain_dates ?? null,
      max_daily_rain: body.max_daily_rain ?? null,
      total_rainfall: body.total_rainfall ?? null,
      rainy_days: body.rainy_days ?? null,
      max_temp: body.max_temp ?? null,
      avg_max_temp: body.avg_max_temp ?? null,
      min_temp: body.min_temp ?? null,
      avg_min_temp: body.avg_min_temp ?? null,
      humidity: body.humidity ?? null,
      gusts_hourly: body.gusts_hourly ?? null,
      times_hourly: body.times_hourly ?? null,
      wind_gusts: body.wind_gusts ?? null,
      wind_speed: body.wind_speed ?? null,
      soil_moisture_available: body.soil_moisture_available ?? false,
      soil_percentile: body.soil_percentile ?? null,
      lightning_score: body.lightning_score ?? null,
      lightning_category: body.lightning_category ?? null,
      station_type: body.station_type ?? "plains",
      crop_heat_threshold: body.crop_heat_threshold ?? null,
    };

    const scores = computeRiskScores(input);
    return NextResponse.json({ success: true, ...scores });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Error in POST /api/risk:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
