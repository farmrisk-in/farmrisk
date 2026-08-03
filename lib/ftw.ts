import { Protocol, PMTiles } from "pmtiles";
import * as maplibregl from "maplibre-gl";

export const FTW_PMTILES_URL =
  "https://data.source.coop/ftw/global-data/predictions/vectors/alpha/global.pmtiles";

let protocol: Protocol | null = null;
let tiles: PMTiles | null = null;

export function getFTWTiles(): PMTiles | null {
  if (typeof window === "undefined") return null;
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  if (!tiles) {
    tiles = new PMTiles(FTW_PMTILES_URL);
    protocol.add(tiles);
  }
  return tiles;
}

export async function resolveSourceLayer(year: string): Promise<string> {
  const tiles = getFTWTiles();
  if (!tiles) {
    throw new Error("[ftw] resolveSourceLayer called outside the browser (no PMTiles instance)");
  }
  const md = (await tiles.getMetadata()) as {
    vector_layers?: { id: string }[];
  };
  const layers = (md.vector_layers || []).map((l) => l.id);
  let hit = layers.find((id) => id.includes(year));
  if (!hit) hit = layers.find((id) => id.toLowerCase().includes("field")) || layers[0];
  if (!hit) {
    throw new Error(`[ftw] PMTiles metadata exposes no vector_layers; cannot resolve a source-layer for year "${year}"`);
  }
  return hit;
}

export function fieldCenter(geometry: Record<string, unknown>): {
  lat: number;
  lng: number;
} | null {
  const b = fieldBounds(geometry);
  if (!b) return null;
  return { lat: (b.minLat + b.maxLat) / 2, lng: (b.minLng + b.maxLng) / 2 };
}

/** Bounding box of a GeoJSON geometry (lng/lat). */
export function fieldBounds(geometry: Record<string, unknown>): {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
} | null {
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  let any = false;

  const walk = (cs: unknown[]): void => {
    cs.forEach((c) => {
      if (Array.isArray(c) && Array.isArray(c[0])) {
        walk(c as unknown[]);
      } else if (Array.isArray(c) && typeof c[0] === "number") {
        any = true;
        const [x, y] = c as number[];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    });
  };

  const coords = (geometry as { coordinates?: unknown[] })?.coordinates;
  if (coords) walk(coords);
  if (!any) return null;
  return { minLng: minX, minLat: minY, maxLng: maxX, maxLat: maxY };
}
