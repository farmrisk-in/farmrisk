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

    const response = await fetch(modelUrl, {
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

    const contentType = response.headers.get("content-type") || "";
    let advisoryText = "";

    if (contentType.includes("application/json")) {
      const jsonRes = await response.json();
      advisoryText =
        jsonRes.advisory_summary ||
        jsonRes.advisory ||
        jsonRes.text ||
        JSON.stringify(jsonRes);
    } else {
      advisoryText = await response.text();
    }

    return NextResponse.json({
      success: true,
      advisory_summary: advisoryText,
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
