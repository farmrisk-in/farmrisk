import { NextRequest } from "next/server";
import {
  searchLocationsWithFallback,
  reverseGeocodeWithFallback,
} from "@/lib/services/locationService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("mode");

  if (mode === "search") {
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return Response.json({ results: [] });
    }

    const results = await searchLocationsWithFallback(query);
    return Response.json({ results });
  }

  if (mode === "reverse") {
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon") || searchParams.get("lng");

    if (!latStr || !lonStr) {
      return Response.json(
        { error: "Latitude and longitude are required." },
        { status: 400 },
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return Response.json(
        { error: "Invalid latitude or longitude coordinates." },
        { status: 400 },
      );
    }

    const result = await reverseGeocodeWithFallback(lat, lon);
    return Response.json(result);
  }

  return Response.json(
    { error: "Invalid location mode. Use search or reverse." },
    { status: 400 },
  );
}
