import { area } from "@turf/area";
import { kinks } from "@turf/kinks";
import { polygon } from "@turf/helpers";
import { fieldCenter } from "./ftw";

/** A single hand-drawn polygon vertex in geographic coordinates. */
export interface DrawnVertex {
  lng: number;
  lat: number;
}

export interface DrawnFieldPayload {
  /** Closed GeoJSON Polygon ring ([lng, lat] pairs, first === last). */
  geometry: Record<string, unknown>;
  areaM2: number;
  centerLat: number;
  centerLng: number;
}

export type DrawValidationReason = "points" | "self-intersection" | "area";

export type DrawValidationResult =
  | { ok: true; areaM2: number; centerLat: number; centerLng: number }
  | { ok: false; reason: DrawValidationReason };

/** Builds a closed GeoJSON Polygon from the drawn vertices. */
export function drawnPolygonGeometry(verts: DrawnVertex[]): Record<string, unknown> {
  const ring = [...verts.map((v) => [v.lng, v.lat]), [verts[0].lng, verts[0].lat]];
  return { type: "Polygon", coordinates: [ring] };
}

/**
 * Validates a drawn polygon: at least 3 distinct vertices, no self
 * intersections and a non-zero area. On success it also returns the polygon's
 * area in square meters and its bounding-box centre so callers can persist the
 * field without re-computing anything.
 */
export function validateDrawnPolygon(verts: DrawnVertex[]): DrawValidationResult {
  if (verts.length < 3) return { ok: false, reason: "points" };
  const seen = new Set<string>();
  for (const v of verts) {
    seen.add(`${Math.round(v.lng * 1e6)},${Math.round(v.lat * 1e6)}`);
  }
  if (seen.size < 3) return { ok: false, reason: "points" };

  const geometry = drawnPolygonGeometry(verts);
  const ring = (geometry.coordinates as number[][][])[0];
  const feature = polygon([ring]);

  try {
    if (kinks(feature).features.length > 0) {
      return { ok: false, reason: "self-intersection" };
    }
    const areaM2 = area(feature);
    if (!(areaM2 > 0)) return { ok: false, reason: "area" };
    const center = fieldCenter(geometry);
    if (!center) return { ok: false, reason: "area" };
    return {
      ok: true,
      areaM2,
      centerLat: center.lat,
      centerLng: center.lng,
    };
  } catch {
    return { ok: false, reason: "area" };
  }
}
