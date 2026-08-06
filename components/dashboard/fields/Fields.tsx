"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPinned,
  LocateFixed,
  Loader2,
  X,
  Search,
  Plus,
  Ruler,
  ShieldCheck,
  PenLine,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocationContext } from "@/providers/LocationProvider";
import { useLocationSearch } from "@/hooks/useLocations";
import { useFields } from "@/hooks/useFields";
import { useAuth } from "@/hooks/useAuth";
import { useNavigation } from "@/hooks/useNavigation";
import { fieldCenter } from "@/lib/ftw";
import type { DrawnFieldPayload } from "@/lib/drawField";
import { consumePendingFieldZoom } from "@/lib/pendingFieldZoom";
import type { ClickedField } from "@/types/fields";
import SaveFieldDialog, { type FieldInfo } from "./SaveFieldDialog";

const FieldMap = dynamic(() => import("./FieldMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full w-full items-center justify-center gap-2 bg-background text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-sm font-medium">{t.fields.mapLoading}</span>
    </div>
  );
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

function fmtArea(m2: number | null | undefined): string {
  if (m2 == null || isNaN(m2)) return "";
  const ha = m2 / 10000;
  return ha >= 1 ? `${ha.toFixed(2)} ha` : `${Math.round(m2)} m²`;
}

export default function Fields() {
  const { t } = useLanguage();
  const f = t.fields;
  const { location } = useLocationContext();
  const { user } = useAuth();
  const { setCurrentPage } = useNavigation();
  const {
    fields: savedFields,
    saveField,
    isSaving,
  } = useFields();

  // Location state
  const [latInput, setLatInput] = useState(
    location ? String(location.lat) : String(DEFAULT_CENTER.lat),
  );
  const [lngInput, setLngInput] = useState(
    location ? String(location.lng) : String(DEFAULT_CENTER.lng),
  );
  const [centerLat, setCenterLat] = useState(
    location?.lat ?? DEFAULT_CENTER.lat,
  );
  const [centerLng, setCenterLng] = useState(
    location?.lng ?? DEFAULT_CENTER.lng,
  );
  const manualRef = useRef(false);

  const [year, setYear] = useState("2025");
  const [selected, setSelected] = useState<ClickedField | null>({
    id: "12345",
    properties: {
      "metrics:area": 100000,
      confidence: 0.85,
      "admin:country_code": "IN",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [72.62, 23.2],
          [72.63, 23.2],
          [72.63, 23.21],
          [72.62, 23.21],
          [72.62, 23.2],
        ],
      ],
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [focusField, setFocusField] = useState<ClickedField | null>(null);

  // Manual draw mode state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnField, setDrawnField] = useState<ClickedField | null>(null);
  const [drawnMeta, setDrawnMeta] = useState<{
    areaM2: number;
    centerLat: number;
    centerLng: number;
  } | null>(null);
  const [saveDrawnOpen, setSaveDrawnOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch = debouncedQuery.trim().length >= 2;
  const { data: results = [], isFetching: loadingResults } = useLocationSearch(
    shouldSearch ? debouncedQuery : "",
  );

  // Adopt the globally selected location until the user navigates manually
  useEffect(() => {
    if (location && !manualRef.current) {
      setLatInput(String(location.lat));
      setLngInput(String(location.lng));
      setCenterLat(location.lat);
      setCenterLng(location.lng);
    }
  }, [location]);

  // Zoom into a saved field requested from the "My Fields" page: centers the
  // map, fits the boundary, highlights it and selects it in the side panel.
  useEffect(() => {
    const pending = consumePendingFieldZoom();
    if (!pending) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelected(pending);
    setFocusField(pending);
    if (pending.year) setYear(String(pending.year));
    const c = fieldCenter(pending.geometry);
    if (c) {
      manualRef.current = true;
      setLatInput(String(c.lat));
      setLngInput(String(c.lng));
      setCenterLat(c.lat);
      setCenterLng(c.lng);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const goTo = (lat: number, lng: number) => {
    manualRef.current = true;
    setLatInput(String(lat));
    setLngInput(String(lng));
    setCenterLat(lat);
    setCenterLng(lng);
  };

  const handleGo = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      toast.error(f.invalidCoords);
      return;
    }
    goTo(lat, lng);
  };

  const handleGps = () => {
    if (!navigator.geolocation) {
      toast.error(f.gpsUnavailable);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        goTo(pos.coords.latitude, pos.coords.longitude);
        toast.success(f.gpsStatus);
      },
      () => toast.error(f.gpsError),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    setSelected(null);
  };

  const handleAdd = () => {
    if (!selected) return;
    if (!user) {
      toast.error(f.fieldsNeedAuth);
      return;
    }
    setDialogOpen(true);
  };

  const startDraw = () => {
    setSelected(null);
    setDrawnField(null);
    setDrawnMeta(null);
    setSaveDrawnOpen(false);
    setIsDrawing(true);
  };

  const handleDrawCommit = (payload: DrawnFieldPayload) => {
    setIsDrawing(false);
    if (!user) {
      toast.error(f.fieldsNeedAuth);
      return;
    }
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setDrawnField({
      id,
      properties: { "manual:source": "manual" },
      geometry: payload.geometry,
    });
    setDrawnMeta({
      areaM2: payload.areaM2,
      centerLat: payload.centerLat,
      centerLng: payload.centerLng,
    });
    setSaveDrawnOpen(true);
  };

  const handleDrawCancel = () => {
    setIsDrawing(false);
    setDrawnField(null);
    setDrawnMeta(null);
  };

  const handleSaveDrawn = async (info: FieldInfo) => {
    if (!drawnField || !drawnMeta) return;
    if (!user) {
      toast.error(f.fieldsNeedAuth);
      return;
    }
    try {
      await saveField({
        fieldId: drawnField.id,
        fieldName: info.name,
        source: "manual",
        year,
        countryCode: null,
        areaM2: drawnMeta.areaM2,
        confidence: null,
        geometry: drawnField.geometry,
        properties: {
          "manual:source": "manual",
          "metrics:area": drawnMeta.areaM2,
        },
        centerLat: drawnMeta.centerLat,
        centerLng: drawnMeta.centerLng,
        crops: info.crops,
        season: info.season,
        cropStage: info.cropStage,
      });
      toast.success(f.addSuccess);
      setSaveDrawnOpen(false);
      setDrawnField(null);
      setDrawnMeta(null);
      setCurrentPage("MyFields");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : f.saveError);
    }
  };

  const handleSaveField = async (info: FieldInfo) => {
    if (!selected) return;
    const props = selected.properties;
    const center = fieldCenter(selected.geometry);
    const fieldId = selected.id;
    if (savedFields.some((x) => x.fieldId === fieldId && x.year === year)) {
      toast.error(f.alreadyAdded);
      return;
    }
    try {
      await saveField({
        fieldId,
        fieldName: info.name,
        source: "detected",
        year,
        countryCode: (props["admin:country_code"] as string) || undefined,
        areaM2:
          props["metrics:area"] != null ? Number(props["metrics:area"]) : null,
        confidence:
          props.confidence != null && props.confidence !== ""
            ? Number(props.confidence)
            : null,
        geometry: selected.geometry,
        properties: props,
        centerLat: center?.lat ?? null,
        centerLng: center?.lng ?? null,
        crops: info.crops,
        season: info.season,
        cropStage: info.cropStage,
      });
      toast.success(f.addSuccess);
      setDialogOpen(false);
      setSelected(null);
      setCurrentPage("MyFields");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : f.saveError);
    }
  };

  const selectedProps = selected?.properties || {};
  const selectedArea =
    selectedProps["metrics:area"] != null
      ? Number(selectedProps["metrics:area"])
      : null;
  const selectedConf =
    selectedProps.confidence != null && selectedProps.confidence !== ""
      ? Math.round(Number(selectedProps.confidence))
      : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Back to My Fields */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentPage("MyFields")}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {f.back}
        </button>
      </div>

      {/* Location control */}
      <Card className="p-4 [--card-spacing:0px]">
        <div className="flex items-center gap-2">
          <MapPinned className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{f.subtitle}</p>

        <Command shouldFilter={false} className="mt-3 bg-transparent p-0">
          <Popover open={isFocused}>
            <div className="relative w-full">
              <PopoverAnchor asChild>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={f.locationPlaceholder}
                  aria-label={f.locationPlaceholder}
                  className="h-11 rounded-2xl bg-background pl-11 pr-10 text-sm shadow-sm"
                />
              </PopoverAnchor>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setQuery("")}
                  aria-label={f.clearSearch}
                  className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </Button>
              )}
              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-(--radix-popover-trigger-width) rounded-2xl p-1.5 shadow-2xl ring-1 ring-foreground/5"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <CommandList className="max-h-72 p-1">
                  {loadingResults ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {f.searching}
                    </div>
                  ) : results.length === 0 ? (
                    <CommandEmpty className="py-6 text-sm text-muted-foreground">
                      {f.noMatches}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {results.map((res, i) => (
                        <CommandItem
                          key={`${res.id}-${i}`}
                          value={`${res.id}-${res.name}-${res.lat}-${res.lng}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onSelect={() => {
                            goTo(res.lat, res.lng);
                            setQuery(res.name);
                            setIsFocused(false);
                          }}
                          className="cursor-pointer rounded-xl px-3 py-2.5"
                        >
                          <MapPinned className="mr-3 size-4 shrink-0 text-muted-foreground" />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">
                              {res.name}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {res.displayName}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </PopoverContent>
            </div>
          </Popover>
        </Command>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {f.latLabel}
            </Label>
            <Input
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {f.lngLabel}
            </Label>
            <Input
              type="number"
              step="any"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              className="bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {f.yearLabel}
            </Label>
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-4xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleGo}
              className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <MapPinned className="size-4" />
              {f.goBtn}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGps}
            className="h-9 border-border"
          >
            <LocateFixed className="size-4 text-primary" />
            {f.gpsBtn}
          </Button>
          <p className="text-[11px] text-muted-foreground">{f.mapHint}</p>
        </div>
      </Card>

      {/* Map + side panel */}
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        {/* Map */}
        <Card className="overflow-hidden shadow-sm [--card-spacing:0px]">
          <CardContent className="relative h-[calc(100vh-28rem)] min-h-[420px] p-2">
            <div className="relative h-full w-full overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <FieldMap
                lat={centerLat}
                lng={centerLng}
                year={year}
                selected={selected}
                focusField={focusField}
                onSelect={setSelected}
                drawing={isDrawing}
                onDrawCommit={handleDrawCommit}
                onDrawCancel={handleDrawCancel}
                className="absolute inset-0"
              />
            </div>
            {!isDrawing && (
              <Button
                type="button"
                size="sm"
                onClick={startDraw}
                className="absolute left-1/2 top-3 z-10 h-9 -translate-x-1/2 gap-1.5 rounded-full bg-primary px-4 text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                <PenLine className="size-4" />
                <span className="hidden sm:inline">{f.drawBtn}</span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <Card className="overflow-hidden [--card-spacing:0px]">
          {/* Selected field */}
          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {f.selectedTitle}
              </h3>
              {selected && (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full text-[10px] font-medium"
                >
                  {f.yearLabel}: {year}
                </Badge>
              )}
            </div>
            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
                <MapPinned className="size-5 text-muted-foreground/80" />
                <p className="text-xs text-muted-foreground">{f.clickHint}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {selectedProps["admin:country_code"]
                    ? `${selectedProps["admin:country_code"]} · ${year}`
                    : `${f.fieldFallbackName} · ${year}`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="secondary"
                    className="max-w-full rounded-full text-[10px] font-medium"
                  >
                    <Ruler className="mr-1 size-3 shrink-0 text-primary" />
                    <span className="truncate">
                      {fmtArea(selectedArea) || f.areaNa}
                    </span>
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="max-w-full rounded-full text-[10px] font-medium"
                  >
                    <ShieldCheck className="mr-1 size-3 shrink-0 text-primary" />
                    <span className="truncate">
                      {selectedConf != null
                        ? `${selectedConf}% ${f.confidenceLabel}`
                        : f.confNa}
                    </span>
                  </Badge>
                </div>
                <p className="truncate rounded-lg bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground/80">
                  {f.idLabel}: {String(selected.id).slice(0, 32)}
                </p>
                <Button
                  type="button"
                  onClick={handleAdd}
                  disabled={isSaving}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {f.addBtn}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <SaveFieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={selected}
        year={year}
        isSaving={isSaving}
        onSave={handleSaveField}
      />

      <SaveFieldDialog
        open={saveDrawnOpen}
        onOpenChange={(open) => {
          setSaveDrawnOpen(open);
          if (!open) {
            setDrawnField(null);
            setDrawnMeta(null);
          }
        }}
        field={drawnField}
        year={year}
        isSaving={isSaving}
        onSave={handleSaveDrawn}
      />
    </div>
  );
}
