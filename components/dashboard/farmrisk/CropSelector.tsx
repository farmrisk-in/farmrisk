"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCrop } from "@/hooks/useCrop";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useAuth } from "@/hooks/useAuth";
import { GENERAL_CROP } from "@/types/crops";
import type { Crop } from "@/types/crops";

export function CropSelector() {
  const { t } = useLanguage();
  const { crops } = useCrop();
  const { selectedCrop, setSelectedCrop } = useSelectedCrop();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Signed-out users may only use the general crop.
  const isFree = !loading && !user;

  // Keep free users pinned to General (e.g. after signing out with a specific
  // crop saved in localStorage, or after a field-linked selection).
  useEffect(() => {
    if (isFree && selectedCrop.id !== GENERAL_CROP.id) {
      setSelectedCrop(GENERAL_CROP);
    }
  }, [isFree, selectedCrop.id, setSelectedCrop]);

  const translateCropName = (crop: Crop) => {
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

  const handleSelect = (option: Crop) => {
    if (isFree && option.id !== GENERAL_CROP.id) {
      router.replace("/auth/login");
      return;
    }
    setSelectedCrop(option);
  };

  return (
    <div className="flex items-center justify-end">
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
            const isLocked = isFree && option.id !== GENERAL_CROP.id;

            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleSelect(option)}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`truncate font-medium ${
                      isLocked ? "text-muted-foreground" : ""
                    }`}
                  >
                    {translateCropName(option)}
                  </span>
                </div>
                {isLocked ? (
                  <Lock className="size-3.5 text-muted-foreground shrink-0" />
                ) : isSelected ? (
                  <Check className="size-3.5 text-primary shrink-0" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}