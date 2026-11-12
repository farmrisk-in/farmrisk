import type { LanguageCode } from "@/constants/languages/registry";

export type LocalizedText = { en: string } & Partial<
  Record<Exclude<LanguageCode, "en">, string>
>;

export type WmoEntry = {
  condition: LocalizedText;
  icon: {
    day: string;
    night?: string;
  };
};

export type CurrentWeather = {
  /** Local wall-clock time with offset, e.g. "2026-11-09T14:00:00+05:30". Read via lib/weatherTime.ts. */
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  precipitation: number;
  cloud_cover: number;
  icon: string;
  condition: LocalizedText;
  /** Numeric WMO code; keys `t.wmo` in the language files. Absent from older API responses. */
  code?: number;
};

export type HourlyWeather = {
  /** Local wall-clock times with offset, e.g. "2026-11-09T14:00:00+05:30". Read via lib/weatherTime.ts. */
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  weather_code: number[];
  icon: string[];
  rain: number[];
  is_day?: number[];
  relative_humidity_2m?: number[];
  apparent_temperature?: number[];
  uv_index?: number[];
  cloud_cover?: number[];
  et0_fao_evapotranspiration?: number[];
};

export type DailyWeather = {
  /** Local wall-clock times with offset, e.g. "2026-11-09T14:00:00+05:30". Read via lib/weatherTime.ts. */
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
};

export type Lightning = {
  score: number;
  category: string;
};

export type LightningData = {
  score: number;
  category: string;
  color: string;
  advisory: string;
};

export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string | null;
  timezoneAbbreviation: string | null;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  lightning: Lightning;
};
