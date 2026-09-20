import kvkListRaw from "@/data/kvk_list.json";

export interface KVKItem {
  zone: string;
  state: string;
  kvk: string;
  district: string;
  host: string;
  year_of_sanction: string;
  host_type: string;
  latitude: number;
  longitude: number;
  coord_precision: string;
}

export interface KVKDetail extends KVKItem {
  distance_km: number;
  bearing: string;
}

export interface NearestKVKResult {
  query: { lat: number; lon: number };
  nearest: KVKDetail | null;
  query_district: string | null;
  district_kvk: KVKDetail | null;
  same_district: boolean | null;
  notes: string[];
}

const EARTH_RADIUS_KM = 6371.0088;

/**
 * Normalises district names removing pin codes, brackets, and common suffixes.
 * Matches python normalise_district implementation exactly.
 */
export function normaliseDistrict(value: string | null | undefined): string {
  let text = String(value || "");
  text = text.replace(/[-\s]*\d{6}\s*$/, ""); // trailing PIN
  text = text.replace(/\(.*?\)/g, " "); // parenthetical asides
  text = text.toLowerCase().replace(/&/g, " and ");
  text = text.replace(/[^a-z\s]/g, " "); // drop dots, digits
  text = text.replace(/\s+/g, " ").trim();
  for (const suffix of [" district", " distt", " dist", " division"]) {
    if (text.endsWith(suffix)) {
      text = text.slice(0, -suffix.length).trim();
    }
  }
  return text;
}

/**
 * Great-circle distance using Haversine formula (matches python numpy haversine_km).
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Compass bearing (matches compass_bearing in python script).
 */
export function compassBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) -
    Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  const deg = (toDeg(Math.atan2(y, x)) + 360) % 360;
  const points = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return points[Math.floor((deg + 11.25) / 22.5) % 16];
}

function describe(row: KVKItem, lat: number, lon: number): KVKDetail {
  const dist = haversineKm(lat, lon, row.latitude, row.longitude);
  return {
    ...row,
    distance_km: Math.round(dist * 10) / 10,
    bearing: compassBearing(lat, lon, row.latitude, row.longitude),
  };
}

const kvkDatabase = kvkListRaw as KVKItem[];

/**
 * Finds nearest Krishi Vigyan Kendra(s) to a given coordinate and optional district.
 * If query point is on a district border, returns both closest straight-line and official district KVK.
 */
export function findNearestKVKs(
  lat: number,
  lon: number,
  queryDistrict?: string | null,
): NearestKVKResult {
  if (
    lat === undefined ||
    lon === undefined ||
    isNaN(lat) ||
    isNaN(lon) ||
    kvkDatabase.length === 0
  ) {
    return {
      query: { lat, lon },
      nearest: null,
      query_district: queryDistrict || null,
      district_kvk: null,
      same_district: null,
      notes: ["Invalid coordinates or empty KVK database."],
    };
  }

  const kvks = kvkDatabase.map((item) => ({
    ...item,
    _district_key: normaliseDistrict(item.district),
    _km: haversineKm(lat, lon, item.latitude, item.longitude),
  }));

  kvks.sort((a, b) => a._km - b._km);

  const nearest = describe(kvks[0], lat, lon);
  const result: NearestKVKResult = {
    query: { lat, lon },
    nearest,
    query_district: queryDistrict || null,
    district_kvk: null,
    same_district: null,
    notes: [],
  };

  if (queryDistrict) {
    const qkey = normaliseDistrict(queryDistrict);
    let same = kvks.filter((k) => k._district_key === qkey);
    if (same.length === 0) {
      same = kvks.filter((k) => k._district_key.includes(qkey));
    }
    if (same.length === 0 && qkey) {
      same = kvks.filter(
        (k) => Boolean(k._district_key) && qkey.includes(k._district_key),
      );
    }

    const sameDistrict =
      normaliseDistrict(nearest.district) === qkey ||
      (same.length > 0 && same[0]._km === kvks[0]._km);

    result.same_district = sameDistrict;

    if (same.length === 0) {
      result.notes.push(
        `No KVK is listed for ${queryDistrict} district, so the nearest one is in a neighbouring district.`,
      );
    } else if (!sameDistrict) {
      result.district_kvk = describe(same[0], lat, lon);
    }
  }

  return result;
}
