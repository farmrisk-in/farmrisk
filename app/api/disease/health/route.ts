import { NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://vegadurmin-farmrisk-disease-detection.hf.space";

function getBaseUrl(): string {
  const url =
    process.env.DISEASE_API_URL ||
    process.env.NEXT_PUBLIC_DISEASE_API_URL ||
    DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

export async function GET() {
  const baseUrl = getBaseUrl();
  try {
    // 1. Try REST /health or /api/v1/health
    let res = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (res && res.ok) {
      try {
        const data = await res.json();
        return NextResponse.json({ online: true, ...data });
      } catch {
        // If it returned HTML (e.g. Gradio frontend), check /config next
      }
    }

    res = await fetch(`${baseUrl}/api/v1/health`, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (res && res.ok) {
      try {
        const data = await res.json();
        return NextResponse.json({ online: true, ...data });
      } catch {
        // continue
      }
    }

    // 2. Check Gradio /config (for Hugging Face Spaces)
    const configRes = await fetch(`${baseUrl}/config`, {
      signal: AbortSignal.timeout(3000),
    }).catch(() => null);

    if (configRes && configRes.ok) {
      try {
        const configData = await configRes.json();
        return NextResponse.json({
          online: true,
          mode: "gradio",
          title: configData.title || "Crop Disease Detection",
          version: configData.version,
        });
      } catch {
        // continue
      }
    }

    return NextResponse.json(
      { online: false, message: "Backend did not respond OK" },
      { status: 503 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { online: false, error: error?.message || "Health check failed" },
      { status: 503 },
    );
  }
}
