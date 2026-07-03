import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  // Defaulting to 16 days to match the standard CPC forecast window
  const days = searchParams.get("days") || "16";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query params are required." },
      { status: 400 }
    );
  }

  // Use a dedicated environment variable for the independent Soil Moisture microservice
  const backendUrl = process.env.SOIL_MODEL_URL || "http://127.0.0.1:8001";
  
  // Proxy the request to our newly created Soil Moisture route
  const url = `${backendUrl}/api/soil-moisture?lat=${lat}&lon=${lon}&days=${days}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Ensure we fetch fresh data. (If the offline scheduler runs daily, 
      // we could configure Next.js ISR cache here (revalidate: 3600) to save backend load).
      cache: "no-store", 
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Soil Moisture API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/soil-moisture:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reach Soil Moisture API" },
      { status: 502 }
    );
  }
}
