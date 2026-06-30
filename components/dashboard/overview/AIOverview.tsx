"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Check, Sprout, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type SelectedLocation,
  useLocationContext,
} from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/use-language";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeather } from "@/hooks/use-weather";

// Define structured options for the agricultural context filter
const CROP_OPTIONS = [
  { id: "general", name: "General (All Crops)", icon: Sprout },
  { id: "wheat", name: "Wheat Cam", icon: Wheat },
  { id: "maize", name: "Maize / Corn", icon: Wheat },
];

const AIOverview = () => {
  const { language } = useLanguage();
  const { location } = useLocationContext();
  const weatherData = useWeather();
  const [selectedCrop, setSelectedCrop] = useState(CROP_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [advisoryText, setAdvisoryText] = useState("");

  const { isLoading, current, hourly, forecast } = weatherData;

  // Trigger POST request to /api/ai with localized, simplified weather details
  const getAIAdvisory = async (
    cropId: string,
    loc: SelectedLocation,
    lang: string,
  ) => {
    setIsGenerating(true);
    try {
      // Localize weather strings to only the currently selected language
      const simplifiedWeather = {
        current: current
          ? {
            temp: current.temp,
            condition: current.condition.en,
            humidity: current.humidity,
            apparentTemp: current.apparentTemp,
            windKph: current.windKph,
            windGustsKph: current.windGustsKph,
            pressureMb: current.pressureMb,
          }
          : undefined,
        hourly:
          hourly?.map((h) => ({
            time: h.time,
            temp: h.temp,
            condition: h.condition.en,
            rainChance: h.rainChance,
            windKph: h.windKph,
          })) || [],
        forecast:
          forecast?.map((f) => ({
            date: f.date,
            day: f.day.en,
            high: f.high,
            low: f.low,
            condition: f.condition.en,
            rainChance: f.rainChance,
          })) || [],
      };

      const response = await fetch("http://localhost:8000/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: cropId,
          latitude: loc.lat,
          longitude: loc.lng,
          language: lang,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error code: ${response.status}`);
      }

      const resData = await response.json();
      setAdvisoryText(
        resData.advisory_summary || "No advisory text could be generated.",
      );
    } catch (err) {
      console.error("AI advisory fetch failed:", err);
      setAdvisoryText(
        "Failed to retrieve advisory. Please check your network connection.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedText = advisoryText.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <span
          key={index}
          className="text-emerald-600 dark:text-emerald-400 text-sm sm:text-base font-semibold"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });


  // Fetch new advisory whenever coordinate, crop, or language parameters change
  useEffect(() => {
    if (!isLoading && current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getAIAdvisory(selectedCrop.id, location, language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, selectedCrop.id, language, isLoading]);

  const ActiveIcon = selectedCrop.icon;

  return (
    <div className="w-full h-full bg-linear-to-br from-emerald-500/10 via-background to-muted/30 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] p-3 select-none relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
      {/* BACKGROUND BRAND GLOW */}
      <div className="absolute -right-16 -top-16 size-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* HEADER SECTION: Title block paired with dropdown controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/10 dark:border-border/60 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-none">
              AI Overview
            </h2>
            <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-1">
              Choose a crop
            </p>
          </div>
        </div>

        {/* CROP SELECTOR DROPDOWN MODULE */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-8 bg-background/60 border-emerald-500/20 hover:border-emerald-500/40 text-foreground text-xs font-medium px-2.5 rounded-lg shadow-xs flex items-center justify-between gap-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ActiveIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{selectedCrop.name}</span>
              </div>
              <ChevronDown className="size-3.5 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-popover border-border text-popover-foreground w-52 p-1 rounded-lg shadow-md z-50"
          >
            {CROP_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = option.id === selectedCrop.id;

              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setSelectedCrop(option)}
                  className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <OptionIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate font-medium">{option.name}</span>
                  </div>
                  {isSelected && (
                    <Check className="size-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* CORE CONTENT SLOT: Scrollable container with simulated generation skeleton loaders */}
      <div className="overflow-y-auto flex-1 min-h-0 max-h-full flex flex-col justify-start">
        {isGenerating || isLoading ? (
          <div className="space-y-2 mt-1">
            <Skeleton className="h-4 w-full rounded-sm" />
            <Skeleton className="h-4 w-[92%] rounded-sm" />
            <Skeleton className="h-4 w-[96%] rounded-sm" />
            <Skeleton className="h-4 w-[85%] rounded-sm" />
            <Skeleton className="h-4 w-[50%] rounded-sm" />
          </div>
        ) : (
          <div className=" pr-1 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
            <p className="text-xs max-h-30 sm:text-sm text-foreground/90 font-medium leading-relaxed tracking-normal whitespace-pre-wrap animate-in fade-in duration-300">
              {formattedText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOverview;
