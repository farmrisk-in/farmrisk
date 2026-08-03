import type { Crop } from "@/types/crops";

type FieldsLabelKeys =
  | "seasonKharif"
  | "seasonRabi"
  | "seasonZaid"
  | "stageSowing"
  | "stageVegetative"
  | "stageFlowering"
  | "stageMaturity";

export const SEASONS = ["kharif", "rabi", "zaid"] as const;
export type Season = (typeof SEASONS)[number];

export const CROP_STAGES = [
  "sowing",
  "vegetative",
  "flowering",
  "maturity",
] as const;
export type CropStage = (typeof CROP_STAGES)[number];

export const SEASON_KEYS: Record<Season, FieldsLabelKeys> = {
  kharif: "seasonKharif",
  rabi: "seasonRabi",
  zaid: "seasonZaid",
};

export const CROP_STAGE_KEYS: Record<CropStage, FieldsLabelKeys> = {
  sowing: "stageSowing",
  vegetative: "stageVegetative",
  flowering: "stageFlowering",
  maturity: "stageMaturity",
};

/**
 * Fallback crop catalogue used when the location-based crop API has no data
 * (e.g. no GPS location resolved yet). Mirrors the ids understood by
 * translateCropName so translations keep working.
 */
export const DEFAULT_CROPS: Crop[] = [
  { id: "cotton", name: "Cotton", area: 0 },
  { id: "wheat", name: "Wheat", area: 0 },
  { id: "rice", name: "Rice", area: 0 },
  { id: "fodder", name: "Fodder", area: 0 },
  { id: "pearlmillet", name: "Pearl Millet", area: 0 },
  { id: "oilseeds", name: "Oilseeds", area: 0 },
  { id: "castor", name: "Castor", area: 0 },
  { id: "sorghum", name: "Sorghum", area: 0 },
  { id: "kharifsorghum", name: "Kharif Sorghum", area: 0 },
  { id: "chickpea", name: "Chickpea", area: 0 },
];
