"use client";

import React from "react";
import CurrentClimate from "@/components/dashboard/insights/CurrentClimate";
import ModelSummary from "@/components/dashboard/insights/ModelSummary";
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
 * Composes existing widgets (compact climate readout, 16-day forecast model
 * summary, lightning risk map) without duplicating their data logic.
 */
const Insights = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <LocationSearchBar />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 w-full items-stretch">
        <div className="flex flex-col gap-4 min-w-0">
          <CurrentClimate />
          <ModelSummary />
        </div>
        <div className="flex min-w-0">
          <Lightning />
        </div>
      </div>
    </div>
  );
};

export default Insights;