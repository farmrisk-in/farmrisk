import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/what-to-do
 *
 * Proxies the "What To Do Today" card request to the backend aggregation
 * endpoint (`/api/advisory/what-to-do`). The backend deterministically selects
 * the best Pest & Disease action + best Irrigation recommendation (weather as
 * fallback) from the existing recommendation systems and returns at most two
 * items. This route only forwards the full advisory payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const modelUrl = process.env.ADVISORY_MODEL_URL;
    if (!modelUrl) {
      return NextResponse.json({
        success: true,
        crop_id: body?.cropId ?? "",
        crop_name: "",
        is_general: true,
        language: body?.language ?? "",
        recommendations: [],
      });
    }

    const response = await fetch(
      `${modelUrl.replace(/\/$/, "")}/api/advisory/what-to-do`,
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
        `What-to-do model error: ${response.status} ${response.statusText}`,
      );
      return NextResponse.json(
        { error: `Failed to query what-to-do model: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai/what-to-do:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}