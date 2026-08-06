"use client";

import React from "react";
import { LocationSearchBar } from "./LocationSearchBar";
import HourlyWeather from "./HourlyWeather";
import Weather from "./Weather";
import WeatherSummary from "./WeatherSummary";
import Greeting from "./Greeting";
import WhatToDoToday from "./WhatToDoToday";

export interface CropOption {
  id: string;
  name: string;
  area: number;
}

const Overview = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Greeting />
      <LocationSearchBar />

      {/* ROW 1: Current Climate (left) + Today's Summary (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 xl:col-span-2 flex">
          <Weather />
        </div>
        <div className="col-span-1 flex">
          <WeatherSummary />
        </div>
      </div>

      {/* ROW 2: What To Do Today (left) + Hourly Forecast (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full items-stretch">
        <div className="col-span-1 flex">
          <WhatToDoToday />
        </div>
        <div className="col-span-1 flex">
          <HourlyWeather compact hourCount={6} />
        </div>
      </div>
    </div>
  );
};

export default Overview;