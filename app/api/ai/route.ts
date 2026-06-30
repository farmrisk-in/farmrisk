import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Path to the python script
    const scriptPath = path.join(process.cwd(), "app/api/ai/advisory.py");

    // Spawn python3 process, feeding the JSON payload into stdin
    const result = spawnSync("python3", [scriptPath], {
      input: JSON.stringify(body),
      encoding: "utf-8",
    });

    if (result.error) {
      console.error("Failed to run python script:", result.error);
      return NextResponse.json(
        { error: "Failed to run Python script: " + result.error.message },
        { status: 500 },
      );
    }

    if (result.status !== 0) {
      console.error("Python script exited with non-zero code:", result.stderr);
      return NextResponse.json(
        { error: "Python execution error: " + result.stderr },
        { status: 500 },
      );
    }

    const output = JSON.parse(result.stdout.trim());
    return NextResponse.json(output);
  } catch (error: any) {
    console.error("Error in POST /api/advisory:", error);
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}
