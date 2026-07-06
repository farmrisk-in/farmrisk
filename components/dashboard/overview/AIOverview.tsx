"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Check, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoaderFive } from "@/components/ui/loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { useCrop } from "@/hooks/useCrop";
import { useAI } from "@/hooks/useAI";
import { useLocationContext } from "@/providers/LocationProvider";
import { type CropOption } from "./Overview";
import { GENERAL_CROP } from "@/types/crops";

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

  const { isLoading: isWeatherLoading } = weatherData;
  const { crops } = useCrop();

  const lastLocationRef = useRef({ lat: location.lat, lng: location.lng });

  useEffect(() => {
    if (
      lastLocationRef.current.lat !== location.lat ||
      lastLocationRef.current.lng !== location.lng
    ) {
      lastLocationRef.current = { lat: location.lat, lng: location.lng };
      setSelectedCrop(GENERAL_CROP);
    }
  }, [location.lat, location.lng, setSelectedCrop]);

  const {
    data: advisoryDataText,
    isLoading: isAiLoading,
    isFetching: isGenerating,
    error: aiError,
  } = useAI(selectedCrop.id, language);

  const advisoryText = aiError
    ? t.dashboard.advisoryError
    : advisoryDataText || "";

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

  return (
    <div className="w-full h-full p-4 relative overflow-hidden flex flex-col justify-between border-2 border-emerald-400 dark:border-emerald-700 rounded-xl">
      {/* HEADER SECTION: Title block paired with dropdown controls */}
      <div className="flex flex-row sm:items-center justify-between gap-3 border-b pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
          <Bot className="size-6" />
          {t.dashboard.aiOverview}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-auto h-8 text-foreground text-xs font-medium px-2.5 rounded-md flex items-center justify-between gap-1.5 cursor-pointer"
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
        {isGenerating || isWeatherLoading || isAiLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 w-full h-full py-6">
            <LoaderFive text={"Generating Overview"} />
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
