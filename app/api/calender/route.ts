import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
async function reverseGeocode(lat: number, lng: number): Promise<{ state: string; district: string }> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const response = await fetch(url, {
    headers: {
      "User-Agent": "farmrisk-dashboard/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed: ${response.statusText}`);
  }

  const data = await response.json();
  const address = data.address || {};
  
  // District is usually in county, state_district, or district
  const district = address.district || address.county || address.state_district || address.city || "";
  const state = address.state || "";

  return { state, district };
}

// -------------------------------------------------------------
// Helper to clean and normalize names for robust matching
// -------------------------------------------------------------
function cleanName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ district$/i, "")
    .replace(/ county$/i, "")
    .replace(/ division$/i, "")
    .replace(/ state_district$/i, "")
    .replace(/[^a-z0-9]/g, ""); // Strip spaces, hyphens, and punctuation
}

// Map UI selected crop IDs (lowercase) to the exact CSV Selector_Crop_Category values (uppercase)
const UI_CROP_TO_CSV_CATEGORIES: Record<string, string[]> = {
  cotton: ["COTTON"],
  wheat: ["WHEAT"],
  rice: ["RICE"],
  paddy: ["RICE"],
  maize: ["MAIZE"],
  barley: ["BARLEY"],
  fingermillet: ["FINGERMILLET"],
  ragi: ["FINGERMILLET"],
  pearlmillet: ["PEARLMILLET"],
  bajra: ["PEARLMILLET"],
  sorghum: ["SORGHUM"],
  jowar: ["SORGHUM"],
  kharifsorghum: ["SORGHUM"],
  chickpea: ["CHICKPEA"],
  gram: ["CHICKPEA"],
  pigeonpea: ["PIGEONPEA"],
  arhar: ["PIGEONPEA"],
  tur: ["PIGEONPEA"],
  potatoes: ["POTATOES"],
  potato: ["POTATOES"],
  sugarcane: ["SUGARCANE"],
  onion: ["ONION"],
  vegetables: ["VEGETABLES"],
  fodder: ["FODDER"],
  castor: ["CASTOR"],
  oilseeds: [
    "RAPESEEDANDMUSTARD",
    "SESAMUM",
    "LINSEED",
    "GROUNDNUT",
    "SOYABEAN",
    "SAFFLOWER",
    "CASTOR",
  ],
  mustard: ["RAPESEEDANDMUSTARD"],
  rapeseed: ["RAPESEEDANDMUSTARD"],
  sesame: ["SESAMUM"],
  sesamum: ["SESAMUM"],
  linseed: ["LINSEED"],
  groundnut: ["GROUNDNUT"],
  soybean: ["SOYABEAN"],
  soyabean: ["SOYABEAN"],
  safflower: ["SAFFLOWER"],
  sunflower: ["SUNFLOWER"],
  pulses: ["MINORPULSES", "PIGEONPEA", "CHICKPEA"],
  minorpulses: ["MINORPULSES"],
};

// Global in-memory cache to prevent parsing the CSV file on every API call for district codes
let districtCodeCache: Record<string, string> | null = null;

async function loadDistrictCodes(): Promise<Record<string, string>> {
  if (districtCodeCache) return districtCodeCache;

  const csvFilePath = path.join(
    process.cwd(),
    "data/clean_crop_calendar_with_categories.csv",
  );
  const cache: Record<string, string> = {};

  return new Promise<Record<string, string>>((resolve, reject) => {
    if (!fs.existsSync(csvFilePath)) {
      return reject(new Error(`CSV file not found at path: ${csvFilePath}`));
    }

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data: any) => {
        const stateClean = cleanName(data.State || "");
        const distClean = cleanName(data.District || "");
        const code = (data.District_Code || "").trim();

        if (stateClean && distClean && code) {
          cache[`${stateClean}:${distClean}`] = code;
        }
      })
      .on("end", () => {
        districtCodeCache = cache;
        resolve(cache);
      })
      .on("error", (err) => reject(err));
  });
}

/**
 * Searches the CSV cache for a district code using exact and fuzzy lookup.
 */
async function findDistrictCode(
  state: string,
  district: string,
): Promise<string | null> {
  const cache = await loadDistrictCodes();
  const stateClean = cleanName(state);
  const distClean = cleanName(district);

  // 1. Try exact matched key: "state:district"
  const exactKey = `${stateClean}:${distClean}`;
  if (cache[exactKey]) {
    return cache[exactKey];
  }

  // 2. Fallback: Fuzzy matching (substring comparison) to handle differences in naming conventions
  for (const key of Object.keys(cache)) {
    const [cState, cDist] = key.split(":");
    if (
      (stateClean.includes(cState) || cState.includes(stateClean)) &&
      (distClean.includes(cDist) || cDist.includes(distClean))
    ) {
      return cache[key];
    }
  }

  return null;
}

interface CalendarRow {
  crop: string;
  season: string;
  sowingPeriod: string;
  harvestingPeriod: string;
  sowFromDay: number | null;
  sowFromMon: number | null;
  sowToDay: number | null;
  sowToMon: number | null;
  harvFromDay: number | null;
  harvFromMon: number | null;
  harvToDay: number | null;
  harvToMon: number | null;
}

/**
 * Fetches all crop calendar rows matching the state, district, and crop category.
 */
async function fetchCalendarRows(
  state: string,
  district: string,
  districtCode: string | null,
  cropParam?: string,
): Promise<CalendarRow[]> {
  const csvFilePath = path.join(
    process.cwd(),
    "data/clean_crop_calendar_with_categories.csv",
  );
  const rows: CalendarRow[] = [];

  const stateClean = cleanName(state);
  const distClean = cleanName(district);

  const rawCropParam = (cropParam || "").toLowerCase().trim();
  const allowedCategories = UI_CROP_TO_CSV_CATEGORIES[rawCropParam] || [];

  return new Promise<CalendarRow[]>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data: any) => {
        const rowStateClean = cleanName(data.State || "");
        const rowDistClean = cleanName(data.District || "");
        const rowCode = (data.District_Code || "").trim();

        // Match either by code (if available) or state + district name
        const isLocMatch =
          (districtCode && rowCode === districtCode) ||
          (rowStateClean === stateClean && rowDistClean === distClean);

        if (isLocMatch) {
          let isCropMatch = false;

          if (rawCropParam) {
            if (rawCropParam !== "general") {
              // Exact match on the pre-cleaned Selector_Crop_Category column
              const rowCategory = (data.Selector_Crop_Category || "")
                .toUpperCase()
                .trim();
              isCropMatch = allowedCategories.includes(rowCategory);
            }
          } else {
            // Default to matching all crops if no crop parameter is specified
            isCropMatch = true;
          }

          if (isCropMatch) {
            rows.push({
              crop: data.Crop || "",
              season: data.Season || "",
              sowingPeriod: data.Sowing_Period || "",
              harvestingPeriod: data.Harvesting_Period || "",
              sowFromDay: data.Sow_From_Day
                ? parseFloat(data.Sow_From_Day)
                : null,
              sowFromMon: data.Sow_From_Mon
                ? parseFloat(data.Sow_From_Mon)
                : null,
              sowToDay: data.Sow_To_Day ? parseFloat(data.Sow_To_Day) : null,
              sowToMon: data.Sow_To_Mon ? parseFloat(data.Sow_To_Mon) : null,
              harvFromDay: data.Harv_From_Day
                ? parseFloat(data.Harv_From_Day)
                : null,
              harvFromMon: data.Harv_From_Mon
                ? parseFloat(data.Harv_From_Mon)
                : null,
              harvToDay: data.Harv_To_Day ? parseFloat(data.Harv_To_Day) : null,
              harvToMon: data.Harv_To_Mon ? parseFloat(data.Harv_To_Mon) : null,
            });
          }
        }
      })
      .on("end", () => resolve(rows))
      .on("error", (err) => reject(err));
  });
}

// -------------------------------------------------------------
// Route Handlers (Supports GET and POST)
// -------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng") || searchParams.get("lon");
    const stateParam = searchParams.get("state");
    const districtParam = searchParams.get("district");
    const cropParam = searchParams.get("crop");

    let state = stateParam || "";
    let district = districtParam || "";

    // If coordinates are provided, reverse geocode to fetch state/district names
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        const details = await reverseGeocode(lat, lng);
        state = details.state;
        district = details.district;
      }
    }

    if (!state || !district) {
      console.warn("<<< [API] GET /api/calender - Missing state/district info");
      return NextResponse.json(
        {
          error:
            "Provide either coordinates (lat/lng) or explicit region parameters (state/district).",
        },
        { status: 400 },
      );
    }

    const code = await findDistrictCode(state, district);
    const calendar = await fetchCalendarRows(
      state,
      district,
      code,
      cropParam || undefined,
    );

    const responseData = {
      success: true,
      state,
      district,
      districtCode: code,
      calendar,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("!!! [API] GET /api/calender - Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve district code" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support nested location payload (or direct properties)
    const loc = body.location || body;
    const lat = parseFloat(loc.lat || loc.latitude);
    const lng = parseFloat(loc.lng || loc.lon || loc.longitude);
    const cropParam = body.crop || body.selectedCrop || "";

    let state = body.state || loc.state || "";
    let district = body.district || loc.district || "";

    if (!state || !district) {
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(
          "<<< [API] POST /api/calender - Missing state/district/coords",
        );
        return NextResponse.json(
          {
            error:
              "Provide a valid location payload with coordinates (lat/lng) or state/district names.",
          },
          { status: 400 },
        );
      }

      const details = await reverseGeocode(lat, lng);
      state = details.state;
      district = details.district;
    }

    const code = await findDistrictCode(state, district);
    const calendar = await fetchCalendarRows(
      state,
      district,
      code,
      cropParam || undefined,
    );

    const responseData = {
      success: true,
      state,
      district,
      districtCode: code,
      calendar,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("!!! [API] POST /api/calender - Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve district code" },
      { status: 500 },
    );
  }
}
