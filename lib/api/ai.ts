import { AIAPIResponse } from "@/types/ai";

export async function getAIAdvisory(
  lat: number,
  lng: number,
  crop: string,
  language: string
): Promise<AIAPIResponse> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      latitude: lat,
      longitude: lng,
      crop,
      language,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI advisory request failed: ${res.statusText}`);
  }

  return res.json();
}
