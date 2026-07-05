export type WeatherCondition = {
  en: string;
  hi: string;
  mr: string;
  ta: string;
  gu: string;
};

export type WeatherIcon = {
  day: string;
  night?: string;
};

export type HourlySlot = {
  time: string;
  temp: number;
  condition: WeatherCondition;
  rainChance: number;
  windKph: number;
  icon: WeatherIcon;
};

export type ForecastSlot = {
  day: WeatherCondition;
  date: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  rainChance: number;
  icon: WeatherIcon;
};

export type CurrentWeather = {
  temp: number;
  condition: WeatherCondition;
  icon: WeatherIcon;
  humidity: number;
  apparentTemp: number;
  windKph: number;
  windGustsKph: number;
  pressureMb: number;
  precipitation: number;
  windDirection: number;
  cloudCover: number;
  surfacePressureMb: number;
};

export type LightnindData = {
  score: number;
  category: string;
  color: string;
  advisory: string;
};

export type WeatherPayload = {
  current: CurrentWeather;
  hourly: HourlySlot[];
  forecast: ForecastSlot[];
  lightning: LightnindData;
};
