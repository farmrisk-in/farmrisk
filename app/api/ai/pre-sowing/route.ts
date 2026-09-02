import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/pre-sowing
 *
 * Proxies the Pre-Sowing advisory generation request to the RAG backend
 * (`/api/advisory/pre-sowing` on ADVISORY_MODEL_URL).
 * Returns all 7 markdown sections with RAG sources metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const modelUrl = process.env.ADVISORY_MODEL_URL || "http://127.0.0.1:7860";
    if (!modelUrl) {
      return NextResponse.json(
        {
          error:
            "RAG Advisory Model URL is not configured. Please set ADVISORY_MODEL_URL in your environment variables.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${modelUrl.replace(/\/$/, "")}/api/advisory/pre-sowing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      let detail: unknown = null;
      try {
        const raw = await response.text();
        detail = raw ? JSON.parse(raw) : null;
      } catch {
        detail = null;
      }
      console.error(
        `Pre-sowing model error: ${response.status} ${response.statusText}`,
        JSON.stringify(detail, null, 2),
      );
      return NextResponse.json(
        {
          error: `Failed to query pre-sowing advisory: ${response.statusText}`,
          detail,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai/pre-sowing:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
