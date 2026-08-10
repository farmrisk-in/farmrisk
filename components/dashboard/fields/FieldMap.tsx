"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToStaticMarkup } from "react-dom/server";
import { Check, Loader2, MapPin, PenLine, Undo2, X } from "lucide-react";
import { area } from "@turf/area";
import { polygon } from "@turf/helpers";
import { cn } from "@/lib/utils";
import {
  FTW_PMTILES_URL,
  fieldBounds,
  getFTWTiles,
  resolveSourceLayer,
} from "@/lib/ftw";
import {
  drawnPolygonGeometry,
  validateDrawnPolygon,
  type DrawnFieldPayload,
  type DrawnVertex,
} from "@/lib/drawField";
import { useIsDarkMode } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import type { ClickedField } from "@/types/fields";

interface FieldMapProps {
  lat: number;
  lng: number;
  year: string;
  /** Field to highlight on the map. Cleared when `null`. */
  selected: ClickedField | null;
  /** When set, the map fits its geometry into view. */
  focusField: { geometry: Record<string, unknown> } | null;
  onSelect: (field: ClickedField) => void;
  /** When true the map is in manual draw mode. */
  drawing?: boolean;
  /** Fired once a valid polygon has been finished by the user. */
  onDrawCommit?: (payload: DrawnFieldPayload) => void;
  /** Fired when the user discards/cancels an in-progress drawing. */
  onDrawCancel?: () => void;
  className?: string;
}

const SOURCE_ID = "ftw";
const LAYER_BG = "ftw-bg";
const LAYER_FILL = "ftw-fill";
const LAYER_LINE = "ftw-line";
const HL_SOURCE = "ftw-hl-source";
const LAYER_HL_FILL = "ftw-hl-fill";
const LAYER_HL_LINE = "ftw-hl-line";

const DRAW_SOURCE = "draw-source";
const LAYER_DRAW_FILL = "draw-fill";
const LAYER_DRAW_LINE = "draw-line";
const LAYER_DRAW_POINTS = "draw-points";

/** How close (in px) a new vertex must be to the first one to auto-finish. */
const SNAP_TOLERANCE_PX = 8;
/** Ignore a click that lands right on the previously placed vertex. */
const MIN_VERTEX_GAP_PX = 4;

const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/** DOM element for the single, always-visible location pin (📍 location marker). */
function createLocationPinElement(): HTMLDivElement {
  const el = document.createElement("div");
  el.innerHTML = renderToStaticMarkup(
    <MapPin
      size={34}
      strokeWidth={2.25}
      className="text-red-600 dark:text-red-500 drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
    />,
  );
  el.style.pointerEvents = "none";
  return el;
}

function addFTWLayers(
  map: maplibregl.Map,
  srcLayer: string,
  onSelect: (field: ClickedField) => void,
  isDrawing: () => boolean,
) {
  if (map.getSource(SOURCE_ID)) return;

  map.addSource(SOURCE_ID, { type: "vector", url: "pmtiles://" + FTW_PMTILES_URL });

  map.addLayer({
    id: LAYER_FILL,
    type: "fill",
    source: SOURCE_ID,
    "source-layer": srcLayer,
    paint: { "fill-color": "#10b981", "fill-opacity": 0.18 },
  });
  map.addLayer({
    id: LAYER_LINE,
    type: "line",
    source: SOURCE_ID,
    "source-layer": srcLayer,
    paint: { "line-color": "#10b981", "line-width": 1.6 },
  });

  map.on("click", LAYER_FILL, (e) => {
    if (isDrawing()) return;
    const f = e.features?.[0];
    if (!f) return;
    onSelect({
      id: String(
        (f.properties as Record<string, unknown>)?.id ?? f.id ?? `f${Date.now()}`,
      ),
      properties: (f.properties as Record<string, unknown>) || {},
      geometry: f.geometry as unknown as Record<string, unknown>,
    });
  });
  map.on("mouseenter", LAYER_FILL, () => {
    if (isDrawing()) {
      map.getCanvas().style.cursor = "crosshair";
      return;
    }
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYER_FILL, () => {
    map.getCanvas().style.cursor = "";
  });
}

/** Highlight layer(s) that render the currently selected field's polygon. */
function addHighlightLayers(map: maplibregl.Map) {
  if (map.getSource(HL_SOURCE)) return;

  map.addSource(HL_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: LAYER_HL_FILL,
    type: "fill",
    source: HL_SOURCE,
    paint: { "fill-color": "#f59e0b", "fill-opacity": 0.35 },
  });
  map.addLayer({
    id: LAYER_HL_LINE,
    type: "line",
    source: HL_SOURCE,
    paint: { "line-color": "#f59e0b", "line-width": 4 },
  });
}

/** Keep the highlight layers above the base field layers. */
function ensureHighlightOnTop(map: maplibregl.Map) {
  if (map.getLayer(LAYER_HL_FILL)) map.moveLayer(LAYER_HL_FILL);
  if (map.getLayer(LAYER_HL_LINE)) map.moveLayer(LAYER_HL_LINE);
}

/** Temp layers for the in-progress hand-drawn polygon. */
function ensureDrawLayers(map: maplibregl.Map) {
  if (map.getSource(DRAW_SOURCE)) return;
  map.addSource(DRAW_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: LAYER_DRAW_FILL,
    type: "fill",
    source: DRAW_SOURCE,
    paint: { "fill-color": "#3b82f6", "fill-opacity": 0.25 },
  });
  map.addLayer({
    id: LAYER_DRAW_LINE,
    type: "line",
    source: DRAW_SOURCE,
    paint: {
      "line-color": "#2563eb",
      "line-width": 2,
      "line-dasharray": [2, 1.5],
    },
  });
  map.addLayer({
    id: LAYER_DRAW_POINTS,
    type: "circle",
    source: DRAW_SOURCE,
    paint: {
      "circle-radius": 6,
      "circle-color": "#ffffff",
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#2563eb",
    },
  });
}

/** GeoJSON that renders the in-progress polygon (line, fill and vertices). */
function drawGeoJSON(verts: DrawnVertex[]): GeoJSON.FeatureCollection {
  const ring = verts.map((v) => [v.lng, v.lat]);
  const closed = [...ring, verts.length ? ring[0] : null].filter(
    (c): c is number[] => c !== null,
  );
  const fc: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  if (verts.length >= 2) {
    fc.features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: closed },
    });
  }
  if (verts.length >= 3) {
    fc.features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closed] },
    });
  }
  verts.forEach((v, i) => {
    fc.features.push({
      type: "Feature",
      properties: { index: i },
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
    });
  });
  return fc;
}

function setDrawData(map: maplibregl.Map, verts: DrawnVertex[]) {
  const src = map.getSource(DRAW_SOURCE);
  if (!src) return;
  (src as maplibregl.GeoJSONSource).setData(drawGeoJSON(verts));
}

export default function FieldMap({
  lat,
  lng,
  year,
  selected,
  focusField,
  onSelect,
  drawing = false,
  onDrawCommit,
  onDrawCancel,
  className,
}: FieldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState<"loading" | "available" | "none">(
    "loading",
  );
  const isDark = useIsDarkMode();
  const { t } = useLanguage();
  const f = t.fields;

  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const yearRef = useRef(year);
  const onSelectRef = useRef(onSelect);
  const onDrawCommitRef = useRef(onDrawCommit);
  const onDrawCancelRef = useRef(onDrawCancel);

  // Drawing state (refs are read by map event handlers, state drives the UI)
  const drawingRef = useRef(false);
  const drawVertsRef = useRef<DrawnVertex[]>([]);
  const dragStateRef = useRef<{ index: number; moved: boolean } | null>(null);
  const suppressClickUntilRef = useRef(0);
  const [drawVerts, setDrawVerts] = useState<DrawnVertex[]>([]);
  const [drawError, setDrawError] = useState<
    "points" | "self-intersection" | "area" | null
  >(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const measureCoverage = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(LAYER_FILL)) return;
    try {
      const n = map.queryRenderedFeatures({
        layers: [LAYER_FILL, LAYER_LINE],
      }).length;
      setDataStatus(n > 0 ? "available" : "none");
    } catch {
      setDataStatus("none");
    }
  }, []);

  useEffect(() => {
    latRef.current = lat;
    lngRef.current = lng;
  }, [lat, lng]);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onDrawCommitRef.current = onDrawCommit;
  }, [onDrawCommit]);

  useEffect(() => {
    onDrawCancelRef.current = onDrawCancel;
  }, [onDrawCancel]);

  const pushVertex = useCallback((v: DrawnVertex) => {
    const verts = [...drawVertsRef.current, v];
    drawVertsRef.current = verts;
    setDrawVerts(verts);
    setDrawError(null);
    const map = mapRef.current;
    if (map) setDrawData(map, verts);
  }, []);

  const finishDrawing = useCallback(() => {
    const map = mapRef.current;
    if (!map || !drawingRef.current) return;
    const verts = drawVertsRef.current;
    if (verts.length < 3) {
      setDrawError("points");
      return;
    }
    const result = validateDrawnPolygon(verts);
    if (!result.ok) {
      setDrawError(result.reason);
      return;
    }
    onDrawCommitRef.current?.({
      geometry: drawnPolygonGeometry(verts),
      areaM2: result.areaM2,
      centerLat: result.centerLat,
      centerLng: result.centerLng,
    });
  }, []);

  const onDrawClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map || !drawingRef.current) return;
      if (Date.now() < suppressClickUntilRef.current) return;
      const verts = drawVertsRef.current;
      if (verts.length > 0) {
        const last = verts[verts.length - 1];
        const lastPt = map.project([last.lng, last.lat]);
        if (Math.hypot(e.point.x - lastPt.x, e.point.y - lastPt.y) < MIN_VERTEX_GAP_PX) {
          return;
        }
        const first = verts[0];
        const firstPt = map.project([first.lng, first.lat]);
        if (
          Math.hypot(e.point.x - firstPt.x, e.point.y - firstPt.y) <=
          SNAP_TOLERANCE_PX
        ) {
          finishDrawing();
          return;
        }
      }
      pushVertex({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    },
    [finishDrawing, pushVertex],
  );

  const onDrawDblClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map || !drawingRef.current) return;
      e.preventDefault();
      suppressClickUntilRef.current = Date.now() + 500;
      const verts = drawVertsRef.current;
      if (verts.length === 0) {
        pushVertex({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      } else {
        const last = verts[verts.length - 1];
        const lastPt = map.project([last.lng, last.lat]);
        if (
          Math.hypot(e.point.x - lastPt.x, e.point.y - lastPt.y) >=
          MIN_VERTEX_GAP_PX
        ) {
          pushVertex({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        }
      }
      finishDrawing();
    },
    [finishDrawing, pushVertex],
  );

  const onDrawMouseDown = useCallback((e: maplibregl.MapMouseEvent) => {
    const map = mapRef.current;
    if (!map || !drawingRef.current) return;
    const feats = map.queryRenderedFeatures(e.point, {
      layers: [LAYER_DRAW_POINTS],
    });
    if (feats.length === 0) return;
    const idx = (feats[0].properties as Record<string, unknown>)?.index;
    if (typeof idx !== "number") return;
    e.preventDefault();
    dragStateRef.current = { index: idx, moved: false };
    map.dragPan.disable();
    map.getCanvas().style.cursor = "grabbing";
    suppressClickUntilRef.current = Date.now() + 300;
  }, []);

  const onDrawMouseMove = useCallback((e: maplibregl.MapMouseEvent) => {
    const map = mapRef.current;
    if (!map || !drawingRef.current) return;
    if (dragStateRef.current) {
      dragStateRef.current.moved = true;
      const index = dragStateRef.current.index;
      const verts = drawVertsRef.current.slice();
      if (!verts[index]) return;
      verts[index] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      drawVertsRef.current = verts;
      setDrawVerts(verts);
      setDrawError(null);
      setConfirmDiscard(false);
      setDrawData(map, verts);
      return;
    }
    const feats = map.queryRenderedFeatures(e.point, {
      layers: [LAYER_DRAW_POINTS],
    });
    map.getCanvas().style.cursor = feats.length > 0 ? "grab" : "crosshair";
  }, []);

  const onDrawMouseUp = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const drag = dragStateRef.current;
    if (drag) {
      dragStateRef.current = null;
      if (drag.moved) suppressClickUntilRef.current = Date.now() + 300;
      map.dragPan.enable();
      if (map.getCanvas().style.cursor === "grabbing") {
        map.getCanvas().style.cursor = "crosshair";
      }
    }
  }, []);

  // Init map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      center: [lngRef.current, latRef.current],
      zoom: 14,
      style: {
        version: 8,
        sources: {
          sat: {
            type: "raster",
            tiles: [SATELLITE_TILES],
            tileSize: 256,
            attribution: "Esri World Imagery | FTW / Source Cooperative",
          },
        },
        layers: [
          { id: LAYER_BG, type: "background", paint: { "background-color": isDark ? "#0f1419" : "#eef2f6" } },
          { id: "sat", type: "raster", source: "sat" },
        ],
      },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-left");

    map.on("error", (e) => {
      console.error("[FieldMap] MapLibre error event:", e);
      const sourceId = (e as unknown as { sourceId?: string }).sourceId;
      if (sourceId === SOURCE_ID) {
        setError(
          "Could not load field boundaries. Please check your connection and try again.",
        );
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current && mapRef.current.getContainer().offsetWidth > 0) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(container);

    // Belt-and-braces: resize when the window changes even if the container
    // observer misses a layout pass (e.g. sidebar collapse / breakpoints).
    const onWindowResize = () => {
      if (mapRef.current && mapRef.current.getContainer().offsetWidth > 0) {
        mapRef.current.resize();
      }
    };
    window.addEventListener("resize", onWindowResize);

    map.on("idle", measureCoverage);
    map.on("moveend", measureCoverage);

    // Drawing interaction listeners (guarded internally by drawingRef)
    map.on("click", onDrawClick);
    map.on("dblclick", onDrawDblClick);
    map.on("mousedown", onDrawMouseDown);
    map.on("mousemove", onDrawMouseMove);
    map.on("mouseup", onDrawMouseUp);

    map.on("load", async () => {
      addHighlightLayers(map);
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = new maplibregl.Marker({
        element: createLocationPinElement(),
        anchor: "bottom",
      })
        .setLngLat([lngRef.current, latRef.current])
        .addTo(map);
      try {
        const tiles = getFTWTiles();
        if (!tiles) throw new Error("PMTiles instance unavailable");
        const srcLayer = await resolveSourceLayer(yearRef.current);
        if (mapRef.current !== map || map.getSource(SOURCE_ID)) {
          setReady(true);
          return;
        }
        addFTWLayers(map, srcLayer, (f) => onSelectRef.current(f), () =>
          drawingRef.current,
        );
        ensureHighlightOnTop(map);
        measureCoverage();
        setError(null);
      } catch (e) {
        console.error("[FieldMap] Could not load FTW tiles:", e);
        setError(
          "Could not load field boundaries. Please check your connection and try again.",
        );
      } finally {
        setReady(true);
      }
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);
      mapRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch year -> reload FTW source layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (async () => {
      try {
        const srcLayer = await resolveSourceLayer(year);
        if (!mapRef.current) return;
        [LAYER_LINE, LAYER_FILL].forEach((l) => {
          if (map.getLayer(l)) map.removeLayer(l);
        });
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        addFTWLayers(map, srcLayer, (f) => onSelectRef.current(f), () =>
          drawingRef.current,
        );
        ensureHighlightOnTop(map);
        measureCoverage();
      } catch (e) {
        console.error("[FieldMap] Could not switch FTW year:", e);
      }
    })();
  }, [year, measureCoverage]);

  // Highlight the selected field (renders its polygon from saved geometry)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(HL_SOURCE)) return;
    const src = map.getSource(HL_SOURCE) as maplibregl.GeoJSONSource;
    src.setData(
      selected
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: selected.geometry as unknown as GeoJSON.Geometry,
              },
            ],
          }
        : { type: "FeatureCollection", features: [] },
    );
  }, [selected, ready]);

  // Fly to new center
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
  }, [lat, lng]);

  // Keep the single location pin pinned to the selected coordinates. MapLibre
  // markers stay fixed in place across flyTo/zoom, so updating the existing
  // marker (setLngLat) repositions it instead of stacking duplicate pins.
  useEffect(() => {
    const marker = locationMarkerRef.current;
    if (!marker) return;
    marker.setLngLat([lng, lat]);
  }, [lat, lng]);

  // Fit the focused field's polygon into view (used by "Zoom" on saved fields)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusField) return;
    const b = fieldBounds(focusField.geometry);
    if (!b) return;
    map.fitBounds(
      [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ],
      {
        padding: { top: 48, bottom: 48, left: 48, right: 48 },
        maxZoom: 19,
        essential: true,
        duration: 1200,
      },
    );
  }, [focusField]);

  // Toggle draw mode: prepare/teardown layers, cursor and interaction
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    // Reset transient drawing UI state in sync with the `drawing` prop.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (drawing) {
      drawingRef.current = true;
      ensureDrawLayers(map);
      [LAYER_DRAW_POINTS, LAYER_DRAW_LINE, LAYER_DRAW_FILL].forEach((id) => {
        if (map.getLayer(id)) map.moveLayer(id);
      });
      map.doubleClickZoom.disable();
      map.getCanvas().style.cursor = "crosshair";
      setDrawError(null);
      setConfirmDiscard(false);
    } else {
      drawingRef.current = false;
      if (dragStateRef.current) {
        dragStateRef.current = null;
        map.dragPan.enable();
      }
      map.doubleClickZoom.enable();
      map.getCanvas().style.cursor = "";
      drawVertsRef.current = [];
      setDrawVerts([]);
      setDrawError(null);
      setConfirmDiscard(false);
      const src = map.getSource(DRAW_SOURCE);
      if (src) {
        (src as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [drawing, ready]);

  // Theme-aware map background
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(LAYER_BG)) return;
    map.setPaintProperty(
      LAYER_BG,
      "background-color",
      isDark ? "#0f1419" : "#eef2f6",
    );
  }, [isDark]);

  const undoVertex = () => {
    const verts = drawVertsRef.current.slice(0, -1);
    drawVertsRef.current = verts;
    setDrawVerts(verts);
    setDrawError(null);
    setConfirmDiscard(false);
    const map = mapRef.current;
    if (map) setDrawData(map, verts);
  };

  const cancelDrawing = () => {
    if (drawVertsRef.current.length > 0 && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onDrawCancelRef.current?.();
  };

  const liveAreaHa = useMemo(() => {
    if (drawVerts.length < 3) return null;
    try {
      const ring = [
        ...drawVerts.map((v) => [v.lng, v.lat]),
        [drawVerts[0].lng, drawVerts[0].lat],
      ];
      return area(polygon([ring])) / 10000;
    } catch {
      return null;
    }
  }, [drawVerts]);

  const drawErrorMessage =
    drawError === "points"
      ? f.drawValidationPoints
      : drawError === "self-intersection"
        ? f.drawValidationSelf
        : drawError === "area"
          ? f.drawValidationArea
          : null;

  return (
    <div className={cn("relative w-full overflow-hidden isolate", className)}>
      <div ref={containerRef} className="bg-background" style={{ position: "absolute", inset: 0 }} />
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 text-muted-foreground backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Loading field boundaries…
            </span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-sm font-medium text-destructive backdrop-blur-sm">
          {error}
        </div>
      )}
      {ready && dataStatus === "none" && !error && (
        <div className="absolute bottom-4 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-background/95 px-4 py-2.5 text-center text-sm font-medium text-foreground shadow-lg backdrop-blur-sm">
          {t.fields.mapNoData}
        </div>
      )}
      {ready && dataStatus !== "loading" && !error && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
          <span
            className={cn(
              "size-2 rounded-full",
              dataStatus === "available" ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          {dataStatus === "available"
            ? t.fields.coverageAvailable
            : t.fields.coverageNoData}
        </div>
      )}
      {drawing && ready && (
        <>
          <div className="pointer-events-none absolute top-3 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
            <div className="pointer-events-auto mx-auto flex items-center justify-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 text-center text-xs font-medium text-foreground shadow-lg backdrop-blur-sm">
              <PenLine className="size-3.5 shrink-0 text-primary" />
              <span>{f.drawInstruction}</span>
            </div>
          </div>
          {drawError && (
            <div
              role="alert"
              className="absolute top-16 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm font-medium text-destructive backdrop-blur-sm"
            >
              {drawErrorMessage}
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur-sm">
              {confirmDiscard ? (
                <>
                  <span className="px-2 text-xs font-medium text-foreground">
                    {f.drawCancelConfirmMsg}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDrawCancelRef.current?.()}
                    className="h-8 rounded-xl text-xs"
                  >
                    {f.drawDiscardBtn}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDiscard(false)}
                    className="h-8 rounded-xl border-border text-xs"
                  >
                    {f.drawKeepBtn}
                  </Button>
                </>
              ) : (
                <>
                  <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
                    {drawVerts.length} {f.drawPointsLabel}
                    {liveAreaHa != null &&
                      ` · ${f.drawAreaLabel} ${liveAreaHa.toFixed(2)} ha`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={undoVertex}
                    disabled={drawVerts.length === 0}
                    aria-label={f.drawUndo}
                    title={f.drawUndo}
                    className="size-8 rounded-xl"
                  >
                    <Undo2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    onClick={finishDrawing}
                    disabled={drawVerts.length < 3}
                    aria-label={f.drawFinish}
                    title={f.drawFinish}
                    className="size-8 rounded-xl"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={cancelDrawing}
                    aria-label={f.cancelBtn}
                    title={f.cancelBtn}
                    className="size-8 rounded-xl"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
