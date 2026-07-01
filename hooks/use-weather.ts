"use client";

import { useEffect, useState } from "react";
import { useLocationContext } from "@/providers/LocationProvider";
// Types that mirror the /api/weather JSON response
export type WeatherCondition = {
  en: string;
  hi: string;
  mr: string;
  ta: string;
  gu: string;
};

export type WeatherIcon =
  | "Sun"
  | "CloudSun"
  | "Cloud"
  | "CloudDrizzle"
  | "CloudRain"
  | "CloudLightning"
  | "Snowflake"
  | "Wind";

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

type WeatherPayload = {
  current: CurrentWeather;
  hourly: HourlySlot[];
  forecast: ForecastSlot[];
};

type WeatherState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: WeatherPayload }
  | { status: "error"; message: string };

//hook
export function useWeather() {
  const { location, isResolving } = useLocationContext();
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    if (isResolving) return; // Wait until initial geolocation coordinates are resolved on load

    let cancelled = false;
    setState({ status: "loading" });

    const url = new URL("/api/weather", window.location.origin);
    url.searchParams.set("lat", String(location.lat));
    url.searchParams.set("lng", String(location.lng));

    fetch(url.toString(), { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WeatherPayload>;
      })
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data });
          try {
            localStorage.setItem("farmrisk-weather-data", JSON.stringify(data));
          } catch (e) {
            console.error("Failed to save weather data to localStorage", e);
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location.lat, location.lng, isResolving]);

  return {
    isLoading:
      isResolving || state.status === "loading" || state.status === "idle",
    isError: !isResolving && state.status === "error",
    errorMessage:
      !isResolving && state.status === "error" ? state.message : undefined,
    current:
      !isResolving && state.status === "success"
        ? state.data.current
        : undefined,
    hourly:
      !isResolving && state.status === "success"
        ? state.data.hourly
        : undefined,
    forecast:
      !isResolving && state.status === "success"
        ? state.data.forecast
        : undefined,
  };
}
