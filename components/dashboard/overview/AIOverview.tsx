"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
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
import { type CropOption, GENERAL_CROP } from "./Overview";
import { cn } from "@/lib/utils";

interface AIOverviewProps {
  selectedCrop: CropOption;
  setSelectedCrop: (crop: CropOption) => void;
}

const AIOverview = ({ selectedCrop, setSelectedCrop }: AIOverviewProps) => {
  const { language, t } = useLanguage();

  const translateCropName = (crop: CropOption) => {
    const id = crop.id.toLowerCase();
    switch (id) {
      case "general":
        return t.dashboard.cropGeneral;
      case "cotton":
        return t.dashboard.cropCotton;
      case "wheat":
        return t.dashboard.cropWheat;
      case "rice":
        return t.dashboard.cropRice;
      case "fodder":
        return t.dashboard.cropFodder;
      case "pearlmillet":
        return t.dashboard.cropPearlmillet;
      case "oilseeds":
        return t.dashboard.cropOilseeds;
      case "castor":
        return t.dashboard.cropCastor;
      case "sorghum":
        return t.dashboard.cropSorghum;
      case "kharifsorghum":
        return t.dashboard.cropKharifsorghum;
      case "chickpea":
        return t.dashboard.cropChickpea;
      default:
        return crop.name;
    }
  };
  const { location } = useLocationContext();
  const weatherData = useWeather();
  const [isGenerating, setIsGenerating] = useState(false);
  const [advisoryText, setAdvisoryText] = useState("");
  const [crops, setCrops] = useState<CropOption[]>([]);

  const { isLoading, current } = weatherData;

  // Trigger POST request to /api/ai with localized, simplified weather details
  const getAIAdvisory = async (
    cropId: string,
    loc: SelectedLocation,
    lang: string,
    signal?: AbortSignal,
  ) => {
    setIsGenerating(true);
    localStorage.removeItem("farmrisk-ai-advisory");
    window.dispatchEvent(new CustomEvent("farmrisk-ai-loading"));
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: cropId,
          latitude: loc.lat,
          longitude: loc.lng,
          language: lang,
          weather: current,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`API error code: ${response.status}`);
      }

      const resData = await response.json();
      const text =
        resData.advisory_summary || "No advisory text could be generated.";

      if (!signal?.aborted) {
        setAdvisoryText(text);
        try {
          localStorage.setItem("farmrisk-ai-advisory", text);
          window.dispatchEvent(
            new CustomEvent("farmrisk-ai-loaded", { detail: text }),
          );
        } catch (e) {
          console.error("Failed to save AI advisory to localStorage", e);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("AI advisory fetch failed:", err);
        setAdvisoryText(t.dashboard.advisoryError);
      }
    } finally {
      if (!signal?.aborted) {
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCropsForCoordinates() {
      if (!location.lat || !location.lng) return;

      try {
        // Queries the CSV-direct API endpoint we built previously
        const response = await fetch(
          `/api/crops?lat=${location.lat}&lng=${location.lng}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (
          !controller.signal.aborted &&
          response.ok &&
          data.success &&
          data.crops &&
          data.crops.length > 0
        ) {
          // General option sits at the top of the selectable dropdown list
          setCrops([GENERAL_CROP, ...data.crops]);
          setSelectedCrop(GENERAL_CROP);
        } else if (!controller.signal.aborted) {
          setCrops([GENERAL_CROP]);
          setSelectedCrop(GENERAL_CROP);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Error fetching regional crops:", err);
          setCrops([GENERAL_CROP]);
          setSelectedCrop(GENERAL_CROP);
        }
      }
    }

    fetchCropsForCoordinates();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng]);

  const formattedText = advisoryText
    .split(/(\*[^*]+\*)/g)
    .map((part, index) => {
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
    const controller = new AbortController();

    if (!isLoading && current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getAIAdvisory(selectedCrop.id, location, language, controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lng, selectedCrop.id, language, isLoading]);
  return (
    <div
      className={cn(
        "w-full h-full p-3 relative overflow-hidden flex flex-col justify-between transition-colors duration-500",
        isLoading || isGenerating
          ? "borderAnimate"
          : "border-3 border-emerald-800 rounded-xl",
      )}
    >
      {/* FIX: Trigger mesh gradient exclusively when generating and not loading */}
      <div
        className={cn(
          "absolute inset-0 animate-mesh pointer-events-none mix-blend-screen transition-opacity duration-1000",
          isGenerating || formattedText
            ? "opacity-100 dark:opacity-80" // Stay visible during generation AND after text arrives
            : "opacity-0", // Hidden by default when idle
        )}
        aria-hidden="true"
      />
      {/* BACKGROUND BRAND GLOW */}
      {/* HEADER SECTION: Title block paired with dropdown controls */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/10 dark:border-border/60 pb-2 mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-none">
                {t.dashboard.aiOverview}
              </h2>
              <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-1">
                {t.dashboard.chooseCrop}
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
                  <span className="truncate">
                    {translateCropName(selectedCrop)}
                  </span>
                </div>
                <ChevronDown className="size-3.5 opacity-60 shrink-0" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="bg-popover border-border text-popover-foreground w-52 p-1 rounded-lg shadow-md z-50"
            >
              {crops.map((option) => {
                const isSelected = option.id === selectedCrop.id;

                return (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSelectedCrop(option)}
                    className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">
                        {translateCropName(option)}
                      </span>
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
    </div>
  );
};

export default AIOverview;
