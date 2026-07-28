/**
 * lib/api/soilMoisture.ts
 *
 * Thin fetch wrapper for /api/soil-moisture.
 * The hook (useSoilMoisture) already calls getSoilMoisture from lib/api/forecast
 * where both getForecast and getSoilMoisture live. This file is a clean re-export
 * alias so consumers can import from a predictable per-domain path if preferred.
 */
export { getSoilMoisture } from "./forecast";
