export interface ForecastDataDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
}

export interface ForecastDataPayload {
  daily: ForecastDataDaily;
}

export interface ForecastRequestPayload {
  lat: number;
  lon: number;
  village_id: number;
  forecast_data?: ForecastDataPayload;
}

export interface GridUsed {
  lat: number;
  lon: number;
  distance_deg: number;
  cached: boolean;
}

export interface DailyForecastCorrection {
  date: string;
  tmax_raw: number;
  tmax_corrected: number;
  tmin_raw: number;
  tmin_corrected: number;
  pcp_raw: number;
  pcp_corrected: number;
}

export interface ForecastBlock {
  success: boolean;
  location: {
    lat: number;
    lon: number;
    elevation_m: number;
  };
  grids_used: GridUsed[];
  forecast_source: string;
  forecast: DailyForecastCorrection[];
  runtime_seconds: number;
}

export interface SoilMoistureRecord {
  date: string;
  P_obs: number;
  Tmean: number;
  PE: number;
  P_eff: number;
  snowpack: number;
  w: number;
  E: number;
  R: number;
  G: number;
  w_frac: number;
  sm_percentile: number;
  is_forecast: number;
}

export interface SoilMoistureBlock {
  success: boolean;
  location: {
    lat: number;
    lon: number;
  };
  cold_start: boolean;
  days_computed: number;
  checkpoint_last_date: string;
  soil_moisture: SoilMoistureRecord[];
  runtime_seconds: number;
}

export interface VillageReportAPIResponse {
  requested_lat: number;
  requested_lon: number;
  village_id: number;
  forecast: ForecastBlock;
  soil_moisture: SoilMoistureBlock;
  cache_hit: boolean;
  total_runtime_seconds: number;
  cache_key: string | null;
}
