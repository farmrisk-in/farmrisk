"use client";

import { usePro } from "@/hooks/usePro";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCrop } from "@/hooks/useCrop";
import { type CropOption } from "./Overview";

interface GreetingProps {
  selectedCrop: CropOption;
  setSelectedCrop: (crop: CropOption) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

export default function Greeting({ selectedCrop, setSelectedCrop }: GreetingProps) {
  const { isPro, loading, firstName, lastName } = usePro();
  const { language, t } = useLanguage();
  const { crops } = useCrop();

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

  const greeting = getGreeting();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="flex items-center justify-between gap-3 px-1 min-h-[44px]">
      <div className="flex flex-col gap-0.5">
        {!loading && isPro && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3 text-amber-500" />
              Personalised Dashboard
            </p>
          </div>
        )}
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
  );
}
