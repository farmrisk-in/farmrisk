"use client";

import React from "react";
import Risk from "@/components/dashboard/overview/Risk";
import HourlyWeather from "@/components/dashboard/overview/HourlyWeather";
import Forcast from "@/components/dashboard/overview/Forecast";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";

/**
 * "Weather" page — everything driven by the sky.
 * Composes existing widgets (Risk gauges, hourly strip, 16-day forecast)
 * without duplicating their data logic.
 */
const WeatherRisks = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <LocationSearchBar />

      <div className="w-full flex">
        <Risk />
      </div>

      <div className="w-full flex">
        <HourlyWeather />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-stretch">
        <div className="col-span-1 lg:col-span-2 flex">
          <Forcast />
        </div>
      </div>
    </div>
  );
};

export default WeatherRisks;