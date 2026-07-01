"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Calendar, MapPin, Sparkles } from "lucide-react";
import { type SelectedLocation } from "@/providers/LocationProvider";
import {
  CurrentWeather,
  HourlySlot,
  WeatherCondition,
} from "@/hooks/use-weather";

interface DownloadTemplateProps {
  location: SelectedLocation;
  language: string;
  weather: {
    current: CurrentWeather | undefined;
    hourly: HourlySlot[] | undefined;
    isLoading: boolean;
  };
}

export default function DownloadTemplate({
  location,
  language,
  weather,
}: DownloadTemplateProps) {
  const [mounted, setMounted] = useState(false);
  const { current: activeCurrent, hourly: activeHourly } = weather;
  const [aiSummary, setAiSummary] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("farmrisk-ai-advisory") ||
        "No overview advisory summary recorded for this location."
      );
    }
    return "Loading summary data...";
  });

  useEffect(() => {
    // Sync the state one last time upon mounting execution
    const stored = localStorage.getItem("aiSummary");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setAiSummary(stored);

    setMounted(true);
  }, []);

  if (!mounted || !activeCurrent) {
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

  const activeLang = language as keyof WeatherCondition;

  return (
    <div className="w-full h-full bg-white text-slate-800 p-8 flex flex-col justify-between font-sans border-t-12 border-emerald-600 box-border">
      {/* 1. REPORT HEADER BRANDING */}
      <div>
        <div className="flex justify-between items-start border-b-2 border-emerald-600/20 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-800">
              🌾 FARMRISK ANALYTICS
            </h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
              Operational Agronomist & Climate Risk Report
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide">
              Official PDF Export
            </span>
            <p className="text-[10px] text-slate-500 font-medium mt-1.5">
              Secure Browser Local Compile
            </p>
          </div>
        </div>

        {/* 2. REGION & RUNTIME METADATA */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 p-3 rounded-lg mt-4 text-[11px]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <MapPin className="size-3 text-emerald-600" />
              <span>Target Location:</span>
            </div>
            <p className="font-bold text-slate-800 text-xs pl-4.5 truncate">
              {location.displayName || location.name}
            </p>
            <p className="font-mono text-slate-500 pl-4.5">
              {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
            </p>
          </div>

          <div className="space-y-1 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar className="size-3 text-emerald-600" />
              <span>Compilation Timestamp:</span>
            </div>
            <p className="font-bold text-slate-800 pl-4.5">{dateStr}</p>
            <p className="font-mono text-slate-500 pl-4.5">
              {timeStr} Local Time
            </p>
          </div>
        </div>

        {/* 3. CURRENT CLIMATE METRICS DOCK */}
        <div className="mt-5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-emerald-600" />
            Live Climate Telemetry
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {/* Temp Block */}
            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                Temperature
              </span>
              <span className="text-lg font-extrabold text-slate-800">
                {activeCurrent.temp}°C
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                Feel: {activeCurrent.apparentTemp}°C
              </span>
            </div>

            {/* Precipitation Block */}
            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                Precipitation
              </span>
              <span className="text-lg font-extrabold text-blue-600">
                {activeCurrent.precipitation} mm
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                Cloud Cover: {activeCurrent.cloudCover}%
              </span>
            </div>

            {/* Wind Block */}
            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                Wind Velocity
              </span>
              <span className="text-lg font-extrabold text-teal-600">
                {activeCurrent.windKph} km/h
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                Gusts: {activeCurrent.windGustsKph} km/h
              </span>
            </div>

            {/* Pressure Block */}
            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg text-center flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                Barometric Press.
              </span>
              <span className="text-lg font-extrabold text-purple-600">
                {activeCurrent.pressureMb} hPa
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                Surface: {activeCurrent.surfacePressureMb} hPa
              </span>
            </div>
          </div>
        </div>

        {/* 4. AI AGRONOMIST ADVISORY CARD */}
        <div className="mt-5 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl relative">
          <div className="absolute top-3.5 right-4 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
            <Sparkles className="size-3 animate-spin-slow" />
            AI Recommended
          </div>
          <h2 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-2">
            AI Agronomist Advisory Report
          </h2>
          <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
            {aiSummary}
          </div>
        </div>

        {/* 5. 12-HOUR FORECAST TIMELINE */}
        {activeHourly && activeHourly.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Next 12-Hour Timeline Forecast
            </h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[10px] border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1.5 px-3">Hour</th>
                    <th className="py-1.5 px-2 text-center">Temp</th>
                    <th className="py-1.5 px-2 text-center">Rain %</th>
                    <th className="py-1.5 px-2 text-center">Wind</th>
                    <th className="py-1.5 px-3 text-right">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeHourly.slice(0, 12).map((slot: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 font-semibold text-slate-600">
                        {slot.time}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-slate-800">
                        {slot.temp}°C
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-blue-600">
                        {slot.rainChance}%
                      </td>
                      <td className="py-1.5 px-2 text-center font-medium text-slate-700">
                        {slot.windKph} kph
                      </td>
                      <td className="py-1.5 px-3 text-right font-medium text-slate-500">
                        {slot.condition[activeLang] || slot.condition.en}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 6. REPORT PRINT FOOTER */}
      <div className="border-t border-slate-200 pt-3 mt-6 flex justify-between items-center text-[9px] text-slate-400 font-medium shrink-0">
        <span>© 2026 FarmRisk Agricultural Decision Support Console</span>
        <span className="font-mono uppercase">
          Page 1 of 1 • System Generated Report
        </span>
      </div>
    </div>
  );
}
