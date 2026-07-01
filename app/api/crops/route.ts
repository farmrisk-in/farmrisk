import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Haversine formula to compute true geographical distances
function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: "Missing lat or lng query parameters" },
        { status: 400 },
      );
    }

    const userLat = parseFloat(latParam);
    const userLng = parseFloat(lngParam);

    // 1. Read the CSV file directly from the filesystem
    const csvPath = path.join(process.cwd(), "data", "cropsData.csv");
    if (!fs.existsSync(csvPath)) {
      console.error(`🚨 CSV file not found at expected path: ${csvPath}`);
      return NextResponse.json(
        { error: "Dataset file missing on server" },
        { status: 500 },
      );
    }

    const csvData = fs.readFileSync(csvPath, "utf8");

    // Replace all carriage returns (\r) to completely clean up Windows text formatting line breaks
    const lines = csvData.replace(/\r/g, "").trim().split("\n");

    // Normalize headers to lowercase to prevent accidental key misses
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Defensive lookup indices
    const latIndex = headers.indexOf("lat");
    const lngIndex = headers.indexOf("lng");
    const distNameIndex = headers.indexOf("distname");
    const stateNameIndex = headers.indexOf("statename");

    // Guard check to notify you exactly which column key is malformed
    if (
      latIndex === -1 ||
      lngIndex === -1 ||
      distNameIndex === -1 ||
      stateNameIndex === -1
    ) {
      console.error(
        "🚨 Key header columns missing or misspelled. Found headers:",
        headers,
      );
      return NextResponse.json(
        { error: "Internal dataset structure mismatch. Check column keys." },
        { status: 500 },
      );
    }

    let closestDistrict = null;
    let minDistance = Infinity;
    let rawRowValues: string[] = [];

    // 2. Linear scan (1-NN search) directly through the CSV strings [cite: 39]
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < headers.length) continue; // Ensure the row isn't truncated

      const distLat = parseFloat(values[latIndex]);
      const distLng = parseFloat(values[lngIndex]);

      // Skip bad row data completely without crashing the route loop execution
      if (isNaN(distLat) || isNaN(distLng)) continue;

      const distance = getDistance(userLat, userLng, distLat, distLng);

      if (distance < minDistance) {
        minDistance = distance;
        closestDistrict = values;
        rawRowValues = values;
      }
    }

    if (!closestDistrict) {
      return NextResponse.json(
        { error: "No matching geospatial data found" },
        { status: 404 },
      );
    }

    // 3. Extract and map crop entries ONLY for the single winning district
    const processedCrops: Array<{ id: string; name: string; area: number }> =
      [];

    // Re-read original headers array for case-sensitive prefix parsing
    const originalHeaders = lines[0].split(",").map((h) => h.trim());

    for (let j = 0; j < originalHeaders.length; j++) {
      const header = originalHeaders[j];

      if (header.startsWith("mean_") && header.includes("AREA")) {
        const area = parseFloat(rawRowValues[j]);

        if (!isNaN(area) && area > 0) {
          // Clean up the header name natively
          let cleanName = header
            .replace("mean_", "")
            .replace(/AREA.*/gi, "") // Cleans up dynamic tails like _1000Ha_
            .replace(/AND/g, " & ")
            .toLowerCase();

          cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

          processedCrops.push({
            id: cleanName.toLowerCase().replace(/\s+/g, "_"),
            name: cleanName,
            area: area,
          });
        }
      }
    }

    // Sort crops descending by area on demand
    processedCrops.sort((a, b) => b.area - a.area);

    return NextResponse.json({
      success: true,
      district: closestDistrict[distNameIndex],
      state: closestDistrict[stateNameIndex],
      distanceKm: parseFloat(minDistance.toFixed(2)),
      crops: processedCrops.slice(0, 10),
    });
  } catch (error: any) {
    console.error("🚨 Full CSV API processing error stack:", error);
    return NextResponse.json(
      {
        error: "Failed to compile dataset records cleanly",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
