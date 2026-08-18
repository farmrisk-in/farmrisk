import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const modelUrl = process.env.ADVISORY_MODEL_URL;
    if (!modelUrl) {
      console.error("ADVISORY_MODEL_URL is not set in env variables");
      return NextResponse.json(
        {
          error:
            "Advisory Model URL is not configured. Please set ADVISORY_MODEL_URL in environment variables.",
        },
        { status: 500 },
      );
    }

    const targetUrl = `${modelUrl.replace(/\/$/, "")}/api/advisory/weather-summary`;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let detail: unknown = null;
      try {
        const raw = await response.text();
        detail = raw ? JSON.parse(raw) : null;
      } catch {
        detail = null;
      }
      console.error(
        `Weather Summary Model Error: ${response.status} ${response.statusText}`,
        JSON.stringify(detail, null, 2),
      );
      return NextResponse.json(
        {
          error: `Failed to query weather summary model: ${response.statusText}`,
          detail,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      weather_summary: data.advisory_summary ?? "",
      translated: data.translated ?? false,
      language: data.language ?? "en",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai/weather-summary:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
