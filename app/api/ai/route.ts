import { NextRequest, NextResponse } from "next/server";
import { getCropAdvisory } from "@/lib/advisory-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract parameters from request body
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const crop = body.crop || "general";
    const language = body.language || "english";
    const crop_stage = body.crop_stage;

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error:
            "Invalid coordinates provided. latitude and longitude must be numbers.",
        },
        { status: 400 },
      );
    }
    // DONT WASTE API CALLS WHILE TESTING
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        advisory_summary:
          "This is a mock advisory summary for testing purposes.",
      });
    }

    // Call the agrometeorological RAG pipeline
    const advisory = await getCropAdvisory({
      latitude,
      longitude,
      crop,
      language,
      crop_stage,
    });

    return NextResponse.json(advisory);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in POST /api/ai:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
