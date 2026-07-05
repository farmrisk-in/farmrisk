"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Leaf,
} from "lucide-react";
import { type SelectedLocation } from "@/providers/LocationProvider";
import { type CropOption } from "./Overview";
import AIOverview from "./AIOverview";
import Forcast from "./Forcast";
import CropCalender from "./CropCalender";

interface DownloadTemplateProps {
  location: SelectedLocation;
  language: string;
  selectedCrop: CropOption;
}

export default function DownloadTemplate({
  location,
  language,
  selectedCrop,
}: DownloadTemplateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-white text-slate-800 p-10 flex flex-col justify-center items-center font-sans">
        <p className="text-sm font-semibold animate-pulse text-emerald-600">
          Loading report template context...
        </p>
      </div>
    );
  }

  // Format local generation timestamp
  const dateStr = new Date().toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
  const timeStr = new Date().toLocaleTimeString(
    language === "hi" ? "hi-IN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="w-full h-full bg-white text-slate-800 p-6 flex flex-col justify-between font-sans border-t-8 border-emerald-600 box-border leading-tight">
      <div className="space-y-4">
        {/* 1. REPORT HEADER */}
        <div className="flex justify-between items-start border-b-2 border-emerald-600/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-emerald-600" />
              <h1 className="text-xl font-black tracking-tight text-emerald-800">
                FARMRISK ANALYTICS
              </h1>
            </div>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
              Operational Agronomist & Climate Risk Report
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wide">
              Official PDF Export
            </span>
            <p className="text-[8px] text-slate-400 font-medium mt-1">
              Secure Browser Local Compile
            </p>
          </div>
        </div>

        {/* 2. REGION & RUNTIME METADATA */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-[10px]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <MapPin className="size-3 text-emerald-600" />
              <span>Target Location:</span>
            </div>
            <p className="font-bold text-slate-800 text-[11px] pl-4.5 truncate">
              {location.displayName || location.name}
            </p>
            <p className="font-mono text-slate-500 pl-4.5">
              {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
            </p>
          </div>

          <div className="space-y-0.5 border-l border-slate-200/80 pl-4">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar className="size-3 text-emerald-600" />
              <span>Compilation Date:</span>
            </div>
            <p className="font-bold text-slate-800 pl-4.5">{dateStr}</p>
            <p className="font-mono text-slate-500 pl-4.5">
              {timeStr} Local Time
            </p>
          </div>
        </div>

        {/* 3. AI AGRONOMIST ADVISORY CARD */}
        <AIOverview
          selectedCrop={selectedCrop}
          setSelectedCrop={() => {}}
          isPrintMode={true}
        />

        {/* 4. 16-DAY RECTIFIED FORECAST */}
        <Forcast isPrintMode={true} />

        {/* 5. REGIONAL CROP CALENDAR */}
        <CropCalender
          selectedCrop={selectedCrop}
          isPrintMode={true}
        />
      </div>

      {/* 6. REPORT PRINT FOOTER */}
      <div className="border-t border-slate-200/80 pt-2.5 mt-4 flex justify-between items-center text-[8px] text-slate-400 font-medium shrink-0">
        <span>© 2026 FarmRisk Agricultural Decision Support Console</span>
        <span className="font-mono uppercase">
          Page 1 of 1 • System Generated Report
        </span>
      </div>
    </div>
  );
}
