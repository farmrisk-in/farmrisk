import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://vegadurmin-farmrisk-disease-detection.hf.space";

function getBaseUrl(): string {
  const url =
    process.env.DISEASE_API_URL ||
    process.env.NEXT_PUBLIC_DISEASE_API_URL ||
    DEFAULT_BASE_URL;
  return url.replace(/\/+$/, "");
}

function extractCropName(label: string): string {
  if (label.startsWith("Bell_Pepper")) return "Bell Pepper";
  if (label.includes("_")) return label.split("_")[0];
  return "General";
}

function splitMarkdownSections(md: string): Record<string, string> {
  const sections: Record<string, string> = {};
  if (!md) return sections;

  const lines = md.split("\n");
  let currentTitle: string | null = null;
  let currentBuffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      if (currentTitle) {
        sections[currentTitle] = currentBuffer.join("\n").trim();
      }
      currentTitle = headingMatch[1].trim();
      currentBuffer = [];
    } else if (currentTitle) {
      currentBuffer.push(line);
    }
  }

  if (currentTitle) {
    sections[currentTitle] = currentBuffer.join("\n").trim();
  }

  return sections;
}

/**
 * Handle Gradio 5/6 API calls (standard for Hugging Face Spaces with sdk: gradio)
 */
async function callGradioAPI(baseUrl: string, file: Blob, fileName: string) {
  // 1. Upload file to Gradio upload endpoint
  const uploadFormData = new FormData();
  uploadFormData.append("files", file, fileName);

  const uploadRes = await fetch(`${baseUrl}/gradio_api/upload`, {
    method: "POST",
    body: uploadFormData,
    signal: AbortSignal.timeout(15000),
  });

  if (!uploadRes.ok) {
    throw new Error(`Gradio upload failed with status ${uploadRes.status}`);
  }

  const uploadJson = await uploadRes.json();
  const filePath = Array.isArray(uploadJson) ? uploadJson[0] : uploadJson?.path;
  if (!filePath) {
    throw new Error("Gradio did not return a valid uploaded file path.");
  }

  // 2. Queue gradio_analyze job
  const callRes = await fetch(`${baseUrl}/gradio_api/call/gradio_analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [{ path: filePath }] }),
    signal: AbortSignal.timeout(15000),
  });

  if (!callRes.ok) {
    throw new Error(`Gradio call failed with status ${callRes.status}`);
  }

  const callJson = await callRes.json();
  const eventId = callJson.event_id;
  if (!eventId) {
    throw new Error("Gradio call did not return an event_id.");
  }

  // 3. Retrieve event stream output
  const streamRes = await fetch(
    `${baseUrl}/gradio_api/call/gradio_analyze/${eventId}`,
    {
      signal: AbortSignal.timeout(30000),
    },
  );

  if (!streamRes.ok) {
    throw new Error(`Gradio event stream failed with status ${streamRes.status}`);
  }

  const streamText = await streamRes.text();
  const lines = streamText.split("\n");
  let outputData: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) {
      try {
        outputData = JSON.parse(trimmed.slice(5).trim());
      } catch {
        // continue search
      }
    }
  }

  if (!outputData || !Array.isArray(outputData) || outputData.length === 0) {
    throw new Error("Could not parse prediction data from Gradio event stream.");
  }

  // outputData: [scoresOrConfidences, note, choicesUpdate, advisoryMarkdown, ctxMarkdown, searchHtml]
  const rawScores = outputData[0];
  const note = typeof outputData[1] === "string" ? outputData[1] : "";
  const advisoryMd = typeof outputData[3] === "string" ? outputData[3] : "";
  const ctxMd = typeof outputData[4] === "string" ? outputData[4] : "";
  const searchHtml = typeof outputData[5] === "string" ? outputData[5] : "";

  let topPrediction = "";
  let confidence = 0;
  let topK: Array<{
    label: string;
    confidence: number;
    confidence_pct: string;
    crop: string;
    is_healthy: boolean;
  }> = [];

  if (rawScores && typeof rawScores === "object") {
    if (Array.isArray(rawScores.confidences)) {
      // Format: { label: "Cotton_Thirps", confidences: [{ label, confidence }, ...] }
      topPrediction = rawScores.label || rawScores.confidences[0]?.label || "";
      confidence = rawScores.confidences[0]?.confidence || 0;
      topK = rawScores.confidences.map((c: any) => ({
        label: c.label,
        confidence: c.confidence,
        confidence_pct: `${Math.round(c.confidence * 100)}%`,
        crop: extractCropName(c.label),
        is_healthy: c.label.toLowerCase().includes("healthy"),
      }));
    } else {
      // Format: { "Cotton_Thirps": 0.25, ... }
      const sorted = Object.entries(rawScores)
        .map(([lab, conf]) => ({
          label: lab,
          confidence: Number(conf),
        }))
        .sort((a, b) => b.confidence - a.confidence);

      if (sorted.length > 0) {
        topPrediction = sorted[0].label;
        confidence = sorted[0].confidence;
        topK = sorted.slice(0, 5).map((s) => ({
          label: s.label,
          confidence: s.confidence,
          confidence_pct: `${Math.round(s.confidence * 100)}%`,
          crop: extractCropName(s.label),
          is_healthy: s.label.toLowerCase().includes("healthy"),
        }));
      }
    }
  }

  const isHealthy = topPrediction.toLowerCase().includes("healthy");
  const isLowConfidence = confidence < 0.5;

  const sections = advisoryMd ? splitMarkdownSections(advisoryMd) : {};

  return {
    prediction: {
      top_prediction: topPrediction,
      confidence,
      confidence_pct: `${Math.round(confidence * 100)}%`,
      is_healthy: isHealthy,
      is_low_confidence: isLowConfidence,
      threshold: 0.5,
      note,
      top_k: topK,
    },
    advisory: advisoryMd
      ? {
          disease: topPrediction,
          is_healthy: isHealthy,
          markdown: advisoryMd,
          sections,
          context_markdown: ctxMd,
          search_html: searchHtml,
        }
      : null,
  };
}

/**
 * POST /api/disease/analyze
 *
 * Proxies crop disease image classification and agronomic advisory
 * to either:
 *  1. Direct FastAPI REST endpoints (/api/v1/analyze or /analyze)
 *  2. Hugging Face Spaces Gradio API (/gradio_api/upload + /gradio_api/call/gradio_analyze)
 *  3. Split endpoints (/api/v1/predict + /api/v1/advisory)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Image file is required under field 'file'." },
        { status: 400 },
      );
    }

    const baseUrl = getBaseUrl();
    const fileName = (file as File).name || "crop.jpg";
    const url = request.nextUrl || new URL(request.url);
    const topK = url.searchParams.get("top_k") || "5";

    // 1. Attempt direct single-shot REST API (/api/v1/analyze)
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file, fileName);

    let analyzeRes: Response | null = null;
    try {
      analyzeRes = await fetch(`${baseUrl}/api/v1/analyze?top_k=${topK}`, {
        method: "POST",
        body: upstreamFormData,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      analyzeRes = null;
    }

    // Try fallback to /analyze
    if (!analyzeRes || analyzeRes.status === 404 || analyzeRes.status === 405) {
      const fallbackFormData = new FormData();
      fallbackFormData.append("file", file, fileName);
      try {
        analyzeRes = await fetch(`${baseUrl}/analyze?top_k=${topK}`, {
          method: "POST",
          body: fallbackFormData,
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        analyzeRes = null;
      }
    }

    if (analyzeRes && analyzeRes.ok) {
      const data = await analyzeRes.json();
      const prediction = data.prediction || {
        top_prediction: data.top_prediction,
        confidence: data.confidence,
        confidence_pct: data.confidence_pct,
        is_healthy: data.is_healthy,
        is_low_confidence: data.is_low_confidence,
        threshold: data.threshold,
        note: data.note,
        top_k: data.top_k,
      };

      const advisory =
        data.advisory ||
        (data.sections
          ? {
              disease: data.disease || data.top_prediction,
              is_healthy: data.is_healthy,
              kb_key: data.kb_key,
              markdown: data.markdown,
              sections: data.sections,
              context_markdown: data.context_markdown,
              search_html: data.search_html,
            }
          : null);

      return NextResponse.json({
        success: true,
        prediction,
        advisory,
      });
    }

    // 2. If REST failed with 404/405 or connection issue, try Hugging Face Gradio API
    try {
      const gradioResult = await callGradioAPI(baseUrl, file, fileName);
      if (gradioResult?.prediction?.top_prediction) {
        return NextResponse.json({
          success: true,
          ...gradioResult,
        });
      }
    } catch (gradioErr: any) {
      console.warn("Gradio API fallback error:", gradioErr?.message || gradioErr);
    }

    // 3. Fallback to /api/v1/predict + /api/v1/advisory
    const predictFormData = new FormData();
    predictFormData.append("file", file, fileName);

    const predictRes = await fetch(`${baseUrl}/api/v1/predict?top_k=${topK}`, {
      method: "POST",
      body: predictFormData,
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);

    if (predictRes && predictRes.ok) {
      const prediction = await predictRes.json();
      let advisory = null;

      if (prediction?.top_prediction && !prediction.is_healthy) {
        try {
          const advisoryRes = await fetch(`${baseUrl}/api/v1/advisory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ disease: prediction.top_prediction }),
            signal: AbortSignal.timeout(10000),
          });
          if (advisoryRes.ok) {
            advisory = await advisoryRes.json();
          }
        } catch (err) {
          console.warn("Failed to fetch optional advisory:", err);
        }
      }

      return NextResponse.json({
        success: true,
        prediction,
        advisory,
      });
    }

    // Failed all pathways
    return NextResponse.json(
      {
        error:
          "Could not connect to Disease Detection model backend. Please verify your DISEASE_API_URL.",
        target: baseUrl,
      },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Error in POST /api/disease/analyze:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
