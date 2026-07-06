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

// •  date  ("2026-07-06"): The Date
// The calendar date for which these conditions are simulated.
// •  P_obs  (0 or 7.77): Precipitation (Rainfall)
// The total amount of rain that fell (or is predicted to fall) on this day, measured in millimeters (mm).
// •  Tmean  (28.605): Mean Temperature
// The average temperature for this day, measured in degrees Celsius (°C).
// •  PE  (6.601): Potential Evapotranspiration
// The amount of water (in mm) that could evaporate from the soil and transpire (sweat) from plants on this day if the soil were completely
// saturated, based on temperature and daylight hours.
// •  P_eff  (0 or 7.77): Effective Precipitation
// The amount of rain (in mm) that actually enters the soil. If it is cold enough to snow, this number will be lower than  P_obs  because the
// water is trapped as snow; in warm weather, it is usually equal to  P_obs .
// •  snowpack  (0): Snow Accumulation
// The depth of water (in mm) currently stored as snow on the ground surface. For most agricultural regions in India, this remains at 0.
// •  w  (12.294): Soil Water Content
// The absolute depth of water (in mm) currently stored inside the active soil/root layer. This represents how much water is available to crops.
// •  E  (0.145): Actual Evapotranspiration
// The amount of water (in mm) that actually evaporated and transpired from the soil and plants on this day. Unlike  PE  (which is what could
// evaporate),  E  is limited by how much moisture is actually left in the soil.
// •  R  (0.006): Runoff
// The amount of excess water (in mm) that runs off the land surface into local streams/rivers because the soil is either saturated or the rain
// fell too quickly to be absorbed.
// •  G  (0): Deep Groundwater Loss
// The amount of water (in mm) that drains downward, escaping the active crop root zone into the deep groundwater table below.
// •  w_frac  (0.0217): Soil Moisture Fraction
// The percentage of the soil's maximum water-holding capacity that is currently filled. For example,  0.0217  means the soil is at 2.17%
// capacity (extremely dry).
// •  sm_percentile  (6.59): Soil Moisture Percentile (0 to 100)
// How wet or dry this day is compared to the exact same day of the year over the past 30+ years of historical observations.
//     • A value of 6.59 means this day is in the driest 6.59% of historical records for this date (indicating severe agricultural drought).
//     • A value of 50.0 would represent perfectly average historical conditions.
//     • A value of 90.0 or above would indicate extremely wet conditions.
// •  is_forecast  (1): Forecast Indicator
// A binary flag where:
//     •  0  means the row is computed using past, actual historical observations (from the IMD data).
//     •  1  means the row is computed using future weather forecasts.

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
