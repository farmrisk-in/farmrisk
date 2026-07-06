import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.FORECAST_MODEL_URL || "http://0.0.0.0:8000";
    const url = `${backendUrl}/village-report`;

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
  } catch (error: unknown) {
    console.error("Error in POST /village-report:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to reach forecast model API";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
