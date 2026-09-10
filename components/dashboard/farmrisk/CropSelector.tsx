"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Lock, Sparkles, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { useCrop } from "@/hooks/useCrop";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useAuth } from "@/hooks/useAuth";
import { GENERAL_CROP } from "@/types/crops";
import type { Crop } from "@/types/crops";
import { OtherCropModal } from "./OtherCropModal";

export function CropSelector() {
  const { t } = useLanguage();
  const { crops } = useCrop();
  const { selectedCrop, setSelectedCrop } = useSelectedCrop();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);

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
    if (crop.isCustom || crop.id.startsWith("custom_")) {
      return crop.name;
    }
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

  const isCustomSelected =
    selectedCrop.isCustom ||
    (!crops.some((c) => c.id === selectedCrop.id) &&
      selectedCrop.id !== GENERAL_CROP.id);

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-auto h-8 text-foreground text-xs font-medium px-2.5 rounded-md flex items-center justify-between gap-1.5 cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">
                {translateCropName(selectedCrop)}
              </span>
              {isCustomSelected && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold px-1 rounded">
                  Other
                </span>
              )}
            </div>
            <ChevronDown className="size-3.5 opacity-60 shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="bg-popover border-border text-popover-foreground w-56 p-1 rounded-lg shadow-md z-50"
        >
          {/* REGIONAL / LOCAL CROPS */}
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

          {/* ACTIVE CUSTOM CROP (IF SELECTED FROM MODAL) */}
          {isCustomSelected && (
            <>
              <DropdownMenuSeparator className="bg-border my-1" />
              <DropdownMenuItem
                onClick={() => {}}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold cursor-default"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="size-3.5 shrink-0 text-emerald-500" />
                  <span className="truncate">{selectedCrop.name}</span>
                </div>
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="bg-border my-1" />

          {/* "OTHER CROPS..." MODAL TRIGGER */}
          <DropdownMenuItem
            onClick={() => {
              if (isFree) {
                router.replace("/auth/login");
                return;
              }
              setIsOtherModalOpen(true);
            }}
            className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Grid className="size-3.5 shrink-0" />
              <span className="truncate font-semibold">Other crop...</span>
            </div>
            {isFree ? (
              <Lock className="size-3.5 text-muted-foreground shrink-0" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Catalog</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* COMPREHENSIVE CATEGORIZED CROP MODAL */}
      <OtherCropModal
        isOpen={isOtherModalOpen}
        onClose={() => setIsOtherModalOpen(false)}
        onSelectCrop={(crop) => {
          setSelectedCrop(crop);
        }}
        currentSelectedCropId={selectedCrop.id}
      />
    </div>
  );
}

export default CropSelector;