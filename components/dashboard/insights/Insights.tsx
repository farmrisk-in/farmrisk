"use client";

import React from "react";
import Weather from "@/components/dashboard/overview/Weather";
import Forcast from "@/components/dashboard/overview/Forecast";
import { LocationSearchBar } from "@/components/dashboard/overview/LocationSearchBar";
import dynamic from "next/dynamic";

const Lightning = dynamic(
  () => import("@/components/dashboard/overview/Lightning").then((mod) => mod.Lightning),
  {
    ssr: false,
  },
);

/**
 * "Insights" page — the hard-to-read technical layer.
 * Composes existing widgets (full climate readout, 16-day forecast model,
 * lightning risk map) without duplicating their data logic.
 */
const Insights = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <LocationSearchBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
        <div className="col-span-1 lg:col-span-2 flex">
          <Weather />
        </div>
        <div className="col-span-1 flex">
          <Lightning />
        </div>
      </div>

      <div className="w-full flex">
        <Forcast />
      </div>
    </div>
  );
};

export default Insights;