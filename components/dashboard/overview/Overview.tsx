"use client";

import React, { useState } from "react";
import AIOverview from "./AIOverview";
import { LocationSearchBar } from "./LocationSearchBar";
import Forcast from "./Forcast";
import { LightningMonitoring } from "./LightningMonitoring";
import HourlyWeather from "./HourlyWeather";
import SoilMoisture from "./SoilMoisture";
import Weather from "./Weather";
import { useWeather } from "@/hooks/use-weather";
import CropCalender from "./CropCalender";

export interface CropOption {
  id: string;
  name: string;
  area: number;
}

export const GENERAL_CROP: CropOption = {
  id: "general",
  name: "General (All Crops)",
  area: 0,
};

const Overview = () => {
  const weatherData = useWeather();
  const { hourly, isLoading } = weatherData;
  const [selectedCrop, setSelectedCrop] = useState<CropOption>(GENERAL_CROP);

  return (
    <div className="flex flex-col gap-4 w-full">
      <LocationSearchBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 flex">
          <Weather weatherData={weatherData} />
        </div>
        <div className="col-span-1 lg:col-span-2 flex">
          <AIOverview selectedCrop={selectedCrop} setSelectedCrop={setSelectedCrop} />
        </div>
      </div>
      <CropCalender selectedCrop={selectedCrop} />
      <Forcast />
      <HourlyWeather hourly={hourly} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 lg:col-span-2 flex">
          <SoilMoisture />
        </div>
        <div className="col-span-1 flex">
          <LightningMonitoring />
        </div>
      </div>
    </div>
  );
};

export default Overview;
