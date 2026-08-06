"use client";

import React from "react";
import { CropSelector } from "@/components/dashboard/farmrisk/CropSelector";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import SoilMoisture from "@/components/dashboard/overview/SoilMoisture";
import AIOverview from "@/components/dashboard/overview/AIOverview";
import CropCalender from "@/components/dashboard/overview/CropCalender";
import PestAndDisease from "@/components/dashboard/farmrisk/PestAndDisease";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";

/**
 * "Farm Risk" page — agronomic risks that need judgement.
 * Composes existing widgets (risk gauges, soil moisture, AI advisory,
 * crop calendar) without duplicating their data logic.
 */
const FarmRisk = () => {
  const { selectedCrop } = useSelectedCrop();

  return (
    <div className="flex flex-col gap-4 w-full">
      <CropSelector />
      <LocationSearchBar />

      <div className="w-full flex">
        <AIOverview selectedCrop={selectedCrop} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-stretch">
        <div className="col-span-1 flex">
          <PestAndDisease />
        </div>
        <div className="col-span-1 flex">
          <SoilMoisture />
        </div>
      </div>

      <CropCalender selectedCrop={selectedCrop} />
    </div>
  );
};

export default FarmRisk;