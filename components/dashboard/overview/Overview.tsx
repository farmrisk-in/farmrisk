"use client";

import React, { useState } from "react";
import AIOverview from "./AIOverview";
import { LocationSearchBar } from "./LocationSearchBar";
import Forcast from "./Forcast";
import dynamic from "next/dynamic";
const Lightning = dynamic(
  () => import("./Lightning").then((mod) => mod.Lightning),
  {
    ssr: false,
  },
);
import HourlyWeather from "./HourlyWeather";
import SoilMoisture from "./SoilMoisture";
import Weather from "./Weather";
import { useWeather } from "@/hooks/useWeather";
import CropCalender from "./CropCalender";

import { GENERAL_CROP } from "@/types/crops";

export interface CropOption {
  id: string;
  name: string;
  area: number;
}

const Overview = () => {
  const weatherData = useWeather();
  const { hourly, isLoading } = weatherData;
  const [selectedCrop, setSelectedCropState] = useState<CropOption>(GENERAL_CROP);

  const setSelectedCrop = (crop: CropOption) => {
    setSelectedCropState(crop);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("farmrisk-selected-crop", JSON.stringify(crop));
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(new CustomEvent("farmrisk-crop-changed", { detail: crop }));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <LocationSearchBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 flex">
          <Weather weatherData={weatherData} />
        </div>
        <div className="col-span-1 lg:col-span-2 flex">
          <AIOverview
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
          />
        </div>
      </div>
      <CropCalender selectedCrop={selectedCrop} />
      <HourlyWeather hourly={hourly} isLoading={isLoading} />
      <Forcast />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 lg:col-span-2 flex">
          {/* <SoilMoisture /> */}
        </div>
        <div className="col-span-1 flex">
          <Lightning />
        </div>
      </div>
    </div>
  );
};

export default Overview;
