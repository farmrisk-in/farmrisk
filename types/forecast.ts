export interface DayPrediction {
  date: string;
  raw: { tmax: number; tmin: number; pcp: number };
  corrected: { tmax: number; tmin: number; pcp: number };
}

export interface ForecastAPIResponse {
  success: boolean;
  predictions: DayPrediction[];
}
