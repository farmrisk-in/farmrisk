import { NextRequest, NextResponse } from "next/server";
import { findNearestKVKs } from "@/lib/services/kvkService";
import { reverseGeocodeWithFallback } from "@/lib/services/locationService";

/**
 * GET /api/kvk
 *
 * Query params:
 * - lat: latitude (e.g. 23.22)
 * - lon / lng: longitude (e.g. 72.65)
 * - district: (optional) query district name. If not provided, reverse geocoding will determine it.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon") || searchParams.get("lng");
    let district = searchParams.get("district");

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { error: "Latitude and longitude query parameters are required." },
        { status: 400 },
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude coordinates." },
        { status: 400 },
      );
    }

    // Auto reverse geocode district if not provided
    if (!district) {
      try {
        const rev = await reverseGeocodeWithFallback(lat, lon);
        if (rev?.district) {
          district = rev.district;
        }
      } catch (e) {
        console.warn("Could not reverse geocode district for KVK search:", e);
      }
    }

    const result = findNearestKVKs(lat, lon, district);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in GET /api/kvk:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
