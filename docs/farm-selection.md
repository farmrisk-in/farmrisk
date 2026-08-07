# Farm Selection — Technical Documentation

> Note on naming: document the app calls this feature **Fields** / **My Fields** and the stored rows are called "farms." The DB columns are `field_id` / `field_name`. This document reflects the actual implementation.

---

## 1. Architecture Overview

Farm Selection lets a user save a farm boundary to their account in two ways:

- **Detected** (`source: "detected"`) — the user *clicks* a pre-computed field polygon rendered from the FT satellite detection dataset.
- **Manual** (`source: "manual"`) — the user *hand-draws* a polygon by clicking to place vertices.

### User flow

1. Navigate to **Select Fields** (`Fields.tsx`, in-memory page `SelectFields`).
2. Optionally use **GPS** (`navigator.geolocation`) to fly the map to the user's location.
3. Click a rendered detected polygon, **or** click **Draw field** to enter draw mode.
4. **Manual draw:** click to add vertices. A ≥3-vertex polygon is drawn. Points snap to the start when returning within 8px of the first vertex; double-click or **Finish** closes it. Vertices can be dragged. Live area (ha) is previewed.
5. Both paths open `SaveFieldDialog` to capture name, crops, season, and crop stage.
6. `saveField()` writes a row to the `saved_fields` table; the app navigates to **My Fields**.

**Persistence:** Supabase (PostgreSQL). There is **no custom REST endpoint** for farms — the browser writes directly through the Supabase JS client. Pages are switched in-memory via `useNavigation` (not route-based).

---

## 2. Database Design

**Table:** `public.saved_fields` (PostgreSQL). **RLS enabled** — users only read/insert/update/delete their own rows.

| Column | PostgreSQL type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` | no | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | no | FK → `auth.users(id)` on delete cascade |
| `field_id` | `text` | yes | source field id (FTW id, or `manual-<ts>-<rand>`) |
| `field_name` | `text` | yes | user-facing name ("North Farm") |
| `year` | `text` | yes | crop/season year |
| `country_code` | `text` | yes | from `admin:country_code` (detected) |
| `geometry` | `jsonb` | yes | GeoJSON Polygon (the boundary) |
| `properties` | `jsonb` | yes | FTW feature attributes / manual marker |
| `center_lat` | `double precision` | yes | bounding-box centroid latitude |
| `center_lng` | `double precision` | yes | bounding-box centroid longitude |
| `area_m2` | `double precision` | yes | area in square meters |
| `confidence` | `double precision` | yes | detection confidence (detected only) |
| `season` | `text` | yes | `kharif` \| `rabi` \| `zaid` |
| `crop_stage` | `text` | yes | `sowing` \| `vegetative` \| `flowering` \| `maturity` |
| `crops` | `text[]` | yes | crop ids from the crops API |
| `source` | `text` | no | check constraint: `('detected','manual')` |
| `created_at` | `timestamptz` | no | default `timezone('utc', now())` |

There is **no `updated_at` column** — only `created_at` is tracked.

### Indexes

- `saved_fields_user_id_idx` on `(user_id)` — per-user lookup.
- `saved_fields_user_field_year_idx` — **unique** `(user_id, field_id, year)` — duplicate-save guard.

### Sample row

```json
{
  "id": "e6c6c80e-...",
  "user_id": "8b0f2a6d-...",
  "field_id": "manual-1720000000000-aB3dQ",
  "field_name": "North Farm",
  "year": "2025",
  "country_code": null,
  "geometry": {"type":"Polygon","coordinates":[[[72.63500,23.24980],[72.63710,23.24975],[72.63705,23.25130],[72.63560,23.25140],[72.63500,23.24980]]]},
  "properties": {"manual:source":"manual","metrics:area":48200},
  "center_lat": 23.2506,
  "center_lng": 72.63635,
  "area_m2": 48200,
  "confidence": null,
  "season": "kharif",
  "crop_stage": "vegetative",
  "crops": ["rice", "wheat"],
  "source": "manual",
  "created_at": "2026-07-07T05:00:00.000Z"
}
```

**Migration files:** `supabase/migrations/20260803000000_create_saved_fields.sql`, `20260803000001_backfill_saved_fields.sql`, `20260803000002_add_source_to_saved_fields.sql`.

---

## 3. Boundary Storage

**Yes — an array of coordinate points** is stored inside a GeoJSON `geometry` (`jsonb` column).

- Points are stored as `[longitude, latitude]` pairs (GeoJSON order), **not** `{latitude, longitude}`.
- The polygon is a single ring — `coordinates[0]` — with N vertices **plus the closing point** (first === last).

```json
"geometry": {
  "type": "Polygon",
  "coordinates": [[
    [72.63560, 23.24980],
    [72.63710, 23.24975],
    [72.63705, 23.25130],
    [72.63560, 23.25140],
    [72.63560, 23.24980]
  ]]
}
```

The ring is built by `drawnPolygonGeometry()` in `lib/drawField.ts`.

---

## 4. Latitude & Longitude

**Both are stored.**

- The full boundary points are stored verbatim inside `geometry`.
- The center is **pre-computed and stored** discretely in `center_lat` / `center_lng`.

Reasons: `center_lat/lng` are denormalized so list rendering, map centering/zoom-in, and centroid-based crops lookups never re-parse the JSONB ring. It is the **bounding-box centroid** (from `lib/ftw.ts` `fieldCenter`), not the true geometric centroid. Points are stored because the boundary is the source of truth for rendering, export, and area export.

---

## 5. Area Calculation

Uses **Turf.js** `@turf/area` (spherical algorithm over the ring).

- **Manual polygons:** `validateDrawnPolygon()` calls `area(polygon([ring]))`. Area and center are computed once and stored.
- **Detected polygons:** area is copied from FTW feature property `"metrics:area"` (square meters) → `Number(...)`.

The resulting `area_m2` is **stored** and not recomputed on read. During drawing a live **hectares** preview is computed on-screen (`area(feature)/10000`), but the persisted value is the validated `areaM2`.

---

## 6. Geometry

- **Representation:** RFC-7946 GeoJSON `Polygon`; `coordinates` holds one ring of `[lng, lat]` pairs.
- **Closure:** the ring always repeats the first vertex last (first === last).
- **Orientation:** one exterior ring, no holes; GeoJSON recommends counter-clockwise but validation does not enforce it.

### Validation (`validateDrawnPolygon`, `lib/drawField.ts`)

1. **≥3 vertices** → else `reason: "points"`.
2. **≥3 distinct positions** (dedup at ~1e-6 rounding) → else `reason: "points"`.
3. **No self-intersection** via `@turf/kinks` → else `reason: "self-intersection"`.
4. **Positive area** via `@turf/area` → else `reason: "area"`.

### Duplicate points
- During drawing, clicks < 4px from the previous vertex are ignored.
- Vertex-dedup happens on snap to the starting vertex (8px) which finishes the polygon.
- Distinct-position check catches colinear duplicates.

---

## 7. Required Libraries

Found in `package.json`:

| Package | Purpose |
|---|---|
| `maplibre-gl` (`4.7.1`) | Main map engine: rendering polygons + drawing interaction listeners. |
| `pmtiles` (`3.2.1`) | Streams FTW boundary vector tiles from a remote `.pmtiles` over the `pmtiles` protocol. |
| `@turf/area` | Polygon area in square meters. |
| `@turf/helpers` | `polygon()` / `feature()` for validation & area. |
| `@turf/kinks` | Self-intersection detection. |
| `@supabase/supabase-js` | Persistence to `saved_fields`. |
| `@supabase/ssr` | Auth/session handling. |
| `react-leaflet` + `leaflet` | Separate **overview** map only — NOT used for saving borders. |
| `@tanstack/react-query` | Data fetching + caching for fields. |
| `next` / `react` | App framework. |

**GPS/Location:** no library — uses `navigator.geolocation` directly (`enableHighAccuracy: true`, 10s timeout).
**Backend** (`backend/requirements.txt`, FastAPI): no geospatial dependencies — all geometry/area math is client-side.

---

## 8. API

There is **no REST endpoint for farms**; persistence is direct via the Supabase JS client.

### Insert (`.insert`) — the save payload
`NewFieldRecord` shape (`hooks/useFields.ts`):

```ts
{
  fieldId: string;
  fieldName: string;
  source: "detected" | "manual";
  year: string;
  countryCode?: string | null;
  areaM2?: number | null;
  confidence?: number | null;
  geometry: Record<string, unknown>; // GeoJSON Polygon
  properties: Record<string, unknown>;
  centerLat?: number | null;
  centerLng?: number | null;
  crops?: string[];
  season?: string;
  cropStage?: string;
}
```

Response: the inserted row mapped to `SavedField`.

### Operations (all `hooks/useFields.ts`)
- **List:** `.select("*").eq("user_id", userId).order("created_at")`.
- **Insert:** `.insert(fieldToRow(...)).select("*").single()`.
- **Update:** `.update(fieldPatchToRow(patch)).eq("id", id).eq("user_id", userId)`.
- **Delete:** `.delete().eq("id", id).eq("user_id", userId)`.
- **GeoJSON export:** built client-side (`MyFields.tsx`) → downloads `my-fields.geojson`.

### Validation
- DB: not-null `user_id`, unique `(user_id, field_id, year)`, `source` check constraint, RLS scope by `auth.uid()`.
- Client: requires auth; name, ≥1 crop, season, stage; duplicate `(fieldId, year)` pre-check.

### Error cases
- Not logged in.
- Already-saved `(fieldId, year)` → "already added".
- Invalid polygon → `points` / `self-intersection` / `area`.
- Supabase errors surfaced as `err.message` toast.

---

## 9. Implementation Details

### Data flow (frontend → backend)

1. **Capture:** MapLibre click gives `lngLat.lng/lat` as a `DrawnVertex` in `drawVertsRef`. Detected polygons are clicked via the fill layer → `onSelect({id, properties, geometry})`.
2. **Transform:** `finishDrawing()` builds a closed ring (`drawnPolygonGeometry`) and validates/computes area + center (`validateDrawnPolygon`). Detected fields get `fieldCenter(geometry)` and area from properties.
3. **Store:** `Fields.tsx` `handleSaveDrawn` / `handleSaveField` build a `NewFieldRecord`, `fieldToRow()` to maps to DB column names, then `saveField()` inserts. `user_id` comes from the authenticated session.
4. **Retrieve/display:** the fields query maps rows → `SavedField`. `MyFields` renders them, centers via `center_lat/lng`, and supports zoom-in (transferred through `sessionStorage` `pendingFieldZoom`) + GeoJSON export. Drawing projects `[lng,lat]` to screen coords for snapping/dragging.

---

## 10. Performance Considerations

- **Storage format:** raw JSON GeoJSON column keeps the boundary while centroid + area are separate scalar indexed columns — a sp document + relational metadata hybrid.
- **Query efficiency:** single-row-per-field with `user_id` index; unique guard prevents duplicates; bounding/center stored so list and zoom reads never re-parse JSONB.
- **Scalability:** fine for hundreds of fields per user. Advanced geospatial queries would require PostGIS (not currently used: no `geometry` type).
- **Precision:** double-precision coordinates; validation dedups at ~1e-6 (≈ decimeter scale), well beyond drawing accuracy. Turf spherical area reduces planar-projection error.

---

## 11. Complete Example

```json
// Save payload (NewFieldRecord)
{
  "fieldId": "manual-1720000000000-aB3dQ",
  "fieldName": "North Farm",
  "source": "manual",
  "year": "2025",
  "countryCode": "IN",
  "areaM2": 48200,
  "confidence": null,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [72.63560, 23.24980],
      [72.63710, 23.24975],
      [72.63705, 23.25130],
      [72.63560, 23.25140],
      [72.63560, 23.24980]
    ]]
  },
  "properties": { "manual:source": "manual", "metrics:area": 48200 },
  "centerLat": 23.2506,
  "centerLng": 72.63635,
  "crops": ["rice", "wheat"],
  "season": "kharif",
  "cropStage": "vegetative"
}
```

```json
// Stored row in public.saved_fields
{
  "id": "uuid",
  "user_id": "uuid",
  "field_id": "manual-1720000000000-aB3dQ",
  "field_name": "North Farm",
  "year": "2025",
  "country_code": "IN",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[72.6356,23.2498],[72.6371,23.2498],[72.63705,23.2513],[72.6356,23.2514],[72.6356,23.2498]]]
  },
  "properties": { "manual:source": "manual", "metrics:area": 48200 },
  "center_lat": 23.2506,
  "center_lng": 72.63635,
  "area_m2": 48200,
  "confidence": null,
  "season": "kharif",
  "crop_stage": "vegetative",
  "crops": ["rice", "wheat"],
  "source": "manual",
  "created_at": "2026-07-07T05:00:00.000Z"
}
```

---

## Key Files for Developers

- Draw geometry/validation: `lib/drawField.ts`
- FTW tile loading + bbox/center helpers: `lib/ftw.ts`
- Drawing map + interactions: `components/dashboard/fields/FieldMap.tsx`
- Page orchestration + save calls: `components/dashboard/fields/Fields.tsx`
- List/export view: `components/dashboard/fields/MyFields.tsx`
- Save dialog: `components/dashboard/fields/SaveFieldDialog.tsx`
- Supabase CRUD: `hooks/useFields.ts`
- Types: `types/fields.ts`, `types/database.ts`
- Schema migrations: `supabase/migrations/`