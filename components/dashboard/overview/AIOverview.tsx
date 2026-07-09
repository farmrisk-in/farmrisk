"use client";

import { Bot } from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { useAI } from "@/hooks/useAI";
import { useForecast } from "@/hooks/useForecast";
import { type CropOption } from "./Overview";

interface AIOverviewProps {
  selectedCrop: CropOption;
}

const AIOverview = ({ selectedCrop }: AIOverviewProps) => {
  const { language, t } = useLanguage();
  const weatherData = useWeather();

  const { isLoading: isWeatherLoading } = weatherData;
  const { isLoading: isForecastLoading } = useForecast();

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
      {/* HEADER SECTION: Title block */}
      <div className="flex flex-row sm:items-center justify-between gap-3 border-b pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
          <Bot className="size-6" />
          {t.dashboard.aiOverview}
        </div>
      </div>

      {/* CORE CONTENT SLOT: Scrollable container with simulated generation skeleton loaders */}
      <div className="overflow-y-auto flex-1 min-h-0 max-h-full flex flex-col justify-start">
        {isGenerating || isWeatherLoading || isAiLoading || isForecastLoading ? (
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
