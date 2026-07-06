import { AIAPIResponse, AIAdvisoryRequestPayload } from "@/types/ai";

export async function getAIAdvisory(
  payload: AIAdvisoryRequestPayload
): Promise<AIAPIResponse> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AI advisory request failed: ${res.statusText}`);
  }

  return res.json();
}
