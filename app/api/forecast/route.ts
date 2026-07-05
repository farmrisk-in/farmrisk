import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const days = searchParams.get("days") || "16";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query params are required." },
      { status: 400 },
    );
  }

  const backendUrl = process.env.FORECAST_MODEL_URL || "http://127.0.0.1:8000";
  const url = `${backendUrl}/api/forecast?lat=${lat}&lon=${lon}&days=${days}`;

  try {
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
  } catch (error: any) {
    console.error("Error in GET /api/forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reach forecast model API" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl =
      process.env.FORECAST_MODEL_URL || "http://127.0.0.1:8000";
    const url = `${backendUrl}/api/forecast`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
  } catch (error: any) {
    console.error("Error in POST /api/forecast:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reach forecast model API" },
      { status: 502 },
    );
  }
}
