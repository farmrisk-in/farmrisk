/**
 * Pre-Sowing Advisory API types and client functions.
 * Connects to the RAG backend endpoint POST /api/advisory/pre-sowing
 * (proxied via /api/ai/pre-sowing).
 */

export type SoilType =
  | "black cotton soil"
  | "sandy loam"
  | "clay"
  | "loam"
  | "laterite"
  | "alluvial"
  | "red soil"
  | "saline"
  | "alkaline";

export type Season = "Kharif" | "Rabi" | "Zaid";

export type IrrigationType = "flood" | "drip" | "sprinkler" | "rainfed";

export interface PresowingRequest {
  crop: string;
  state: string;
  soil_type: SoilType;
  season?: Season;
  irrigation_type?: IrrigationType;
  language?: string;
}

export interface PresowingSections {
  sowing_window?: string;
  seed_selection?: string;
  field_preparation?: string;
  fertilizer_plan?: string;
  irrigation?: string;
  weed_management?: string;
  pest_disease?: string;
  [key: string]: string | undefined;
}

export interface PresowingResponse {
  crop: string;
  state: string;
  season: string;
  soil_type: string;
  irrigation_type: string;
  language?: string;
  generated_at: string;
  rag_sources_used: number;
  runtime_seconds: number;
  sections: PresowingSections;
}

export const SOIL_TYPE_OPTIONS: {
  value: SoilType;
  labelKey: "blackCotton" | "alluvial" | "red" | "loam" | "sandyLoam" | "clay" | "laterite" | "saline" | "alkaline";
}[] = [
  { value: "black cotton soil", labelKey: "blackCotton" },
  { value: "alluvial", labelKey: "alluvial" },
  { value: "red soil", labelKey: "red" },
  { value: "loam", labelKey: "loam" },
  { value: "sandy loam", labelKey: "sandyLoam" },
  { value: "clay", labelKey: "clay" },
  { value: "laterite", labelKey: "laterite" },
  { value: "saline", labelKey: "saline" },
  { value: "alkaline", labelKey: "alkaline" },
];

export const SEASON_OPTIONS: {
  value: Season;
  labelKey: "kharif" | "rabi" | "zaid";
}[] = [
  { value: "Kharif", labelKey: "kharif" },
  { value: "Rabi", labelKey: "rabi" },
  { value: "Zaid", labelKey: "zaid" },
];

export const IRRIGATION_TYPE_OPTIONS: {
  value: IrrigationType;
  labelKey: "flood" | "drip" | "sprinkler" | "rainfed";
}[] = [
  { value: "flood", labelKey: "flood" },
  { value: "drip", labelKey: "drip" },
  { value: "sprinkler", labelKey: "sprinkler" },
  { value: "rainfed", labelKey: "rainfed" },
];

export const INDIAN_STATES: string[] = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export const CANONICAL_CROPS: string[] = [
  "Cotton",
  "Wheat",
  "Rice",
  "Paddy",
  "Maize",
  "Millets",
  "Bajra",
  "Jowar",
  "Barley",
  "Groundnut",
  "Soybean",
  "Mustard",
  "Rapeseed",
  "Sesame",
  "Sunflower",
  "Castor",
  "Sugarcane",
  "Chickpea",
  "Lentil",
  "Black gram",
  "Green gram",
  "Moong",
  "Urad",
  "Tur",
  "Pigeonpea",
  "Tomato",
  "Potato",
  "Onion",
  "Garlic",
  "Chilli",
  "Brinjal",
  "Okra",
  "Cabbage",
  "Cauliflower",
  "Cucumber",
  "Banana",
  "Mango",
  "Papaya",
  "Guava",
  "Turmeric",
  "Ginger",
  "Grapes",
  "Pomegranate",
];

export async function fetchPresowingAdvisory(
  payload: PresowingRequest,
): Promise<PresowingResponse> {
  const res = await fetch("/api/ai/pre-sowing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail =
        errJson.error ||
        (errJson.detail ? JSON.stringify(errJson.detail) : "") ||
        res.statusText;
    } catch {
      errorDetail = res.statusText;
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }

  return res.json();
}
