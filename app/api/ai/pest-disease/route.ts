import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/pest-disease
 *
 * Proxies the crop-specific Pest & Disease card request to the RAG backend
 * (`/api/advisory/pest-card`). The backend decides the deterministic risk
 * band and retrieves crop-filtered ICAR knowledge; this route only forwards
 * the full advisory payload and returns the structured card.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const modelUrl = process.env.ADVISORY_MODEL_URL;
    if (!modelUrl) {
      return NextResponse.json({
        success: true,
        risk: "LOW",
        summary:
          "RAG Advisory Model URL is not configured. Please set ADVISORY_MODEL_URL in your environment variables.",
        potential: [],
        actions: [],
        score: 0,
        driver: "no backend configured",
        potential_sources: [],
        sources: [],
      });
    }

    const response = await fetch(
      `${modelUrl.replace(/\/$/, "")}/api/advisory/pest-card`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      console.error(
        `Pest card model error: ${response.status} ${response.statusText}`,
      );
      return NextResponse.json(
        { error: `Failed to query pest card model: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai/pest-disease:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
