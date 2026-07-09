import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const modelUrl = process.env.ADVISORY_MODEL_URL;
    if (!modelUrl) {
      return NextResponse.json({
        success: true,
        advisory_summary:
          "RAG Advisory Model URL is not configured. Please set ADVISORY_MODEL_URL in your environment variables.",
      });
    }

    const response = await fetch(`${modelUrl}/api/advisory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `RAG Model Error: ${response.status} ${response.statusText}`,
      );
      return NextResponse.json(
        { error: `Failed to query RAG model: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      advisory_summary:
        data.advisory_summary ??
        data.advisory ??
        data.text ??
        JSON.stringify(data),
      translated: data.translated ?? false,
      language: data.language ?? "en",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
