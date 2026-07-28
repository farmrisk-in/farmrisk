"use client";

import React, { useState, useEffect, useRef } from "react";
import AIOverview from "./AIOverview";
import { LocationSearchBar } from "./LocationSearchBar";
import Forcast from "./Forecast";
import dynamic from "next/dynamic";
const Lightning = dynamic(
  () => import("./Lightning").then((mod) => mod.Lightning),
  {
    ssr: false,
  },
);
import HourlyWeather from "./HourlyWeather";
import Weather from "./Weather";
import CropCalender from "./CropCalender";
import SoilMoisture from "./SoilMoisture";
import { GENERAL_CROP } from "@/types/crops";
import Greeting from "./Greeting";
import { useLocationContext } from "@/providers/LocationProvider";
import WeatherSummary from "./WeatherSummary";
import Risk from "./Risk";

export interface CropOption {
  id: string;
  name: string;
  area: number;
}

const Overview = () => {
  const [selectedCrop, setSelectedCropState] =
    useState<CropOption>(GENERAL_CROP);

  const { location } = useLocationContext();
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(
    location ? { lat: location.lat, lng: location.lng } : null,
  );

  const setSelectedCrop = (crop: CropOption) => {
    setSelectedCropState(crop);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("farmrisk-selected-crop", JSON.stringify(crop));
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(
        new CustomEvent("farmrisk-crop-changed", { detail: crop }),
      );
    }
  };

  useEffect(() => {
    if (!location) return;
    if (
      !lastLocationRef.current ||
      lastLocationRef.current.lat !== location.lat ||
      lastLocationRef.current.lng !== location.lng
    ) {
      lastLocationRef.current = { lat: location.lat, lng: location.lng };
      setSelectedCrop(GENERAL_CROP);
    }
  }, [location?.lat, location?.lng]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <Greeting selectedCrop={selectedCrop} setSelectedCrop={setSelectedCrop} />
      <LocationSearchBar />
      <div className="flex flex-col xl:flex-row items-stretch w-full gap-3">
        <div className="w-full xl:w-90 2xl:w-105 shrink-0 flex">
          <WeatherSummary />
        </div>
        <div className="w-full xl:flex-1 flex">
          <Risk />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 flex">
          <Weather />
        </div>
        <div className="col-span-1 lg:col-span-2 flex">
          <AIOverview selectedCrop={selectedCrop} />
        </div>
      </div>
      <CropCalender selectedCrop={selectedCrop} />
      <HourlyWeather />
      <Forcast />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 lg:col-span-2 flex">
          <SoilMoisture />
        </div>
        <div className="col-span-1 flex">
          <Lightning />
        </div>
      </div>
    </div>
  );
};

export default Overview;
