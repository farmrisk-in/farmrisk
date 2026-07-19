"use client";

import { Bot, BookOpen } from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeather } from "@/hooks/useWeather";
import { useAI } from "@/hooks/useAI";
import { useForecast } from "@/hooks/useForecast";
import { type CropOption } from "./Overview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    sources = [],
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
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider justify-between">
          <Bot className="size-6" />
          {t.dashboard.aiOverview}
        </div>
        {!isGenerating &&
          !isWeatherLoading &&
          !isAiLoading &&
          !isForecastLoading &&
          selectedCrop.id.toLowerCase() !== "general" && (
            <>
              {sources.length > 0 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-emerald-500 active:scale-95 transition-all uppercase cursor-pointer py-0.5 px-1.5 rounded hover:bg-emerald-500/10">
                      <BookOpen className="size-3" />
                      {t.dashboard.sources}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-popover border border-border rounded-2xl shadow-xl flex flex-col p-6">
                    <DialogHeader className="border-b pb-4 mb-4">
                      <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <BookOpen className="size-5 text-emerald-500" />
                        {t.dashboard.retrievedSources}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-1">
                        {t.dashboard.sourcesDescription}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                      {Array.from(
                        new Set(
                          sources.map((s: any) => s.source || "ICAR Guideline"),
                        ),
                      ).map((sourceName: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border bg-emerald-50/5 dark:bg-emerald-950/5 hover:border-emerald-500/20 transition-all font-mono text-xs text-foreground/85 flex items-center gap-2"
                        >
                          <span className="text-emerald-500">📄</span>
                          {sourceName}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/40 uppercase select-none py-0.5 px-1.5">
                  <BookOpen className="size-3 opacity-40" />
                  {t.dashboard.noSources}
                </span>
              )}
            </>
          )}
      </div>

      {/* CORE CONTENT SLOT: Scrollable container with simulated generation skeleton loaders */}
      <div className="overflow-y-auto flex-1 min-h-0 max-h-full flex flex-col justify-start">
        {isGenerating ||
        isWeatherLoading ||
        isAiLoading ||
        isForecastLoading ? (
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
