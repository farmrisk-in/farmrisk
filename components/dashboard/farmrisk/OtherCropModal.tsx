"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CATEGORIZED_CROPS,
  ALL_CATEGORIZED_CROPS,
  CategorizedCrop,
} from "@/constants/categorizedCrops";
import type { Crop } from "@/types/crops";
import {
  Search,
  X,
  Wheat,
  Layers,
  Droplets,
  Sparkles,
  Carrot,
  Apple,
  Flame,
  Coffee,
  Flower2,
  Tractor,
  Check,
  Sprout,
  Grid,
} from "lucide-react";

interface OtherCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCrop: (crop: Crop) => void;
  currentSelectedCropId?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cereals: Wheat,
  pulses: Layers,
  oilseeds: Droplets,
  cash_crops: Sparkles,
  vegetables: Carrot,
  fruits: Apple,
  spices: Flame,
  plantation: Coffee,
  medicinal_flowers: Flower2,
  fodder: Tractor,
};

export function OtherCropModal({
  isOpen,
  onClose,
  onSelectCrop,
  currentSelectedCropId,
}: OtherCropModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return CATEGORIZED_CROPS.map((cat) => {
      if (selectedCategory !== "all" && cat.id !== selectedCategory) {
        return null;
      }

      const matchingCrops = cat.crops.filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.hindiName && c.hindiName.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
        );
      });

      if (matchingCrops.length === 0) return null;

      return {
        ...cat,
        crops: matchingCrops,
      };
    }).filter(Boolean);
  }, [searchQuery, selectedCategory]);

  const totalResultsCount = useMemo(() => {
    return filteredCategories.reduce(
      (sum, cat) => sum + (cat ? cat.crops.length : 0),
      0,
    );
  }, [filteredCategories]);

  const handlePickCrop = (crop: CategorizedCrop) => {
    const cleanCrop: Crop = {
      id: `custom_${crop.id}`,
      name: crop.name.split(" (")[0], // Clean canonical English name for display & RAG prompt
      area: 0,
      category: crop.category,
      isCustom: true,
    };
    onSelectCrop(cleanCrop);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl lg:max-w-6xl w-[94vw] max-h-[88vh] h-[86vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
        {/* MODAL HEADER */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card/60 shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <Sprout className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-xl font-bold text-foreground">
                  Browse All Crops Catalog
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Select any crop from our comprehensive database of {ALL_CATEGORIZED_CROPS.length}+ categorized crops.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalResultsCount} crops available
              </span>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search across all crops by English or Hindi name (e.g. Tomato, Haldi, Mango, Chilli, Ragi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-10 text-xs sm:text-sm bg-background border-border rounded-xl focus-visible:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
              }`}
            >
              <Grid className="size-3.5" />
              <span>All ({ALL_CATEGORIZED_CROPS.length})</span>
            </button>

            {CATEGORIZED_CROPS.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Sprout;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>
                    {cat.name} ({cat.crops.length})
                  </span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* SCROLLABLE CROPS GRID */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-background">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <Search className="size-7" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No crops found matching &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Try searching with an alternative English or Hindi name, or select &ldquo;All&rdquo; to browse all categories.
              </p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              if (!cat) return null;
              const Icon = CATEGORY_ICONS[cat.id] || Sprout;

              return (
                <div key={cat.id} className="space-y-3">
                  {/* CATEGORY SECTION HEADER */}
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Icon className="size-3.5" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {cat.name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        ({cat.crops.length})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {cat.description}
                    </span>
                  </div>

                  {/* CROPS CARDS */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cat.crops.map((crop) => {
                      const isSelected =
                        currentSelectedCropId === `custom_${crop.id}` ||
                        currentSelectedCropId?.toLowerCase() === crop.id.toLowerCase() ||
                        currentSelectedCropId?.toLowerCase() ===
                          crop.name.split(" (")[0].toLowerCase();

                      return (
                        <button
                          key={crop.id}
                          type="button"
                          onClick={() => handlePickCrop(crop)}
                          className={`group relative flex flex-col items-start justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[72px] ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500 dark:bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500"
                              : "bg-card hover:bg-muted/60 border-border hover:border-emerald-500/50 hover:shadow-xs"
                          }`}
                        >
                          <div className="w-full flex items-start justify-between gap-1.5">
                            <span
                              className={`text-xs sm:text-sm font-semibold leading-snug line-clamp-1 ${
                                isSelected
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                              }`}
                            >
                              {crop.name.split(" (")[0]}
                            </span>
                            {isSelected && (
                              <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                <Check className="size-2.5" />
                              </div>
                            )}
                          </div>

                          <div className="mt-1 flex flex-col gap-0.5 w-full">
                            {crop.hindiName && (
                              <span className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                                {crop.hindiName}
                              </span>
                            )}
                            {crop.name.includes("(") && (
                              <span className="text-[10px] text-muted-foreground/75 line-clamp-1">
                                {crop.name.split("(")[1]?.replace(")", "")}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OtherCropModal;
