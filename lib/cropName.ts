import type { TranslationType } from "@/constants/content";

export function translateCropName(
  crop: { id: string; name: string },
  t: TranslationType,
): string {
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
}
