import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing lat or lon query parameters" },
        { status: 400 },
      );
    }

    const backendUrl = (process.env.FORECAST_MODEL_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    const url = `${backendUrl}/forecast?lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Forecast model API error: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/forecast:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reach forecast model API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
