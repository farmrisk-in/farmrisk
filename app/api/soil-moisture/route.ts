import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const daysbefore = searchParams.get("daysbefore");
    const crop = searchParams.get("crop");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing lat or lon query parameters" },
        { status: 400 },
      );
    }

    const backendUrl =
      process.env.FORECAST_MODEL_URL || "http://127.0.0.1:8000";
    let url = `${backendUrl}/moisture?lat=${lat}&lon=${lon}`;
    if (crop && crop !== "general") {
      url += `&crop=${crop}`;
    }
    if (daysbefore) {
      url += `&daysbefore=${daysbefore}`; // because 16 days are future predicted
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Soil moisture model API error: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/soil-moisture:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reach soil moisture model API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
