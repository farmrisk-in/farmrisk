import { CropsAPIResponse } from "@/types/crops";

export async function getCrops(lat: number, lng: number): Promise<CropsAPIResponse> {
  const res = await fetch(`/api/crops?lat=${lat}&lng=${lng}`);

  if (!res.ok) {
    throw new Error(`Crops request failed: ${res.statusText}`);
  }

  return res.json();
}
