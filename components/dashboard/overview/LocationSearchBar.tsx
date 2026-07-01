/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  MouseEvent,
  TouchEvent,
} from "react";
import {
  Search,
  MapPinned,
  LocateFixed,
  X,
  Crosshair,
  Loader2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useLanguage } from "@/hooks/use-language";
import {
  useLocationContext,
  type SelectedLocation,
} from "@/providers/LocationProvider";

import {
  project,
  unproject,
  reverseGeocode,
  formatCoordinates,
} from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

const TILE_SIZE = 256;
const INITIAL_ZOOM = 11;

type SearchResult = SelectedLocation & { id: string };

const BUTTON_TRANSLATIONS: Record<
  string,
  {
    locationShort: string;
    locationMedium: string;
    mapShort: string;
    mapMedium: string;
  }
> = {
  en: {
    locationShort: "Location",
    locationMedium: "Use Location",
    mapShort: "Map",
    mapMedium: "Select Map",
  },
  hi: {
    locationShort: "स्थान",
    locationMedium: "स्थान का उपयोग",
    mapShort: "नक्शा",
    mapMedium: "नक्शा चुनें",
  },
  mr: {
    locationShort: "स्थान",
    locationMedium: "स्थान वापरा",
    mapShort: "नकाशा",
    mapMedium: "नकाशा निवडा",
  },
  ta: {
    locationShort: "இடம்",
    locationMedium: "இடத்தைப் பயன்படுத்து",
    mapShort: "வரைபடம்",
    mapMedium: "வரைபடம் தேர்வு",
  },
  gu: {
    locationShort: "સ્થાન",
    locationMedium: "સ્થાન વાપરો",
    mapShort: "નકશો",
    mapMedium: "નકશો પસંદ કરો",
  },
};

export function LocationSearchBar() {
  const { t, language } = useLanguage();
  const locTrans = t.locationSearchBar;
  const btnTrans = BUTTON_TRANSLATIONS[language] || BUTTON_TRANSLATIONS.en;

  // Hook directly into the global location provider
  const { location, setLocation } = useLocationContext();

  // Standard input query state, synchronized with selected location name
  const [query, setQuery] = useState(location.name);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Map Dialog State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [center, setCenter] = useState({
    lat: location.lat,
    lng: location.lng,
  });
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  // Dragging state for map panning
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, lat: 0, lng: 0 });
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);

  // Client-side mount check to prevent visual lag/layout shifts during hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize input query when the location name changes globally (e.g. from GPS or Map)
  useEffect(() => {
    setQuery(location.name);
  }, [location.name]);

  // --- SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    const trimmed = query.trim();
    // Do not search if query is empty or matches currently active selection
    if (trimmed.length < 2 || trimmed === location.name) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    // Snappy 150ms debounce delay for fast response times
    const timeout = window.setTimeout(async () => {
      try {
        setLoadingResults(true);
        const url = new URL("/api/locations", window.location.origin);
        url.searchParams.set("mode", "search");
        url.searchParams.set("q", trimmed);

        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Search failed");

        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoadingResults(false);
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query, location.name]);

  // Synchronize map center when dialog opens or location changes
  useEffect(() => {
    if (isMapOpen) {
      setCenter({ lat: location.lat, lng: location.lng });
    }
  }, [isMapOpen, location]);

  // --- GLOBAL SELECTION HANDLER ---
  const updateGlobalLocation = (next: Omit<SelectedLocation, "source">) => {
    setLocation({
      lat: next.lat,
      lng: next.lng,
      name: next.name,
      displayName: next.displayName,
    });
    setQuery(next.name);
    setResults([]);
    setIsFocused(false);
    setIsMapOpen(false); // Close map if open
  };

  // --- GEOLOCATION LOGIC ---
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        language === "hi"
          ? "भौगोलिक स्थान (GPS) इस ब्राउज़र में उपलब्ध नहीं है। कृपया सुरक्षित कनेक्शन (HTTPS) का उपयोग करें।"
          : "Geolocation is not supported in this browser or context. Make sure you are using a secure connection (HTTPS).",
      );
      return;
    }

    setIsLocating(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const successCallback = async (position: GeolocationPosition) => {
      try {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const reverse = await reverseGeocode(lat, lng);

        updateGlobalLocation({
          lat: reverse.lat,
          lng: reverse.lng,
          name: reverse.name,
          displayName: reverse.displayName,
        });
        toast.success(locTrans.gpsStatus);
      } catch {
        // Fallback if reverse geocoding fails
        updateGlobalLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Current Location",
          displayName: formatCoordinates(
            position.coords.latitude,
            position.coords.longitude,
          ),
        });
        toast.success(locTrans.gpsStatus);
      } finally {
        setIsLocating(false);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error);

      if (error.code === error.PERMISSION_DENIED) {
        const isSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        const msg = !isSecure
          ? language === "hi"
            ? "जीपीएस विफल: असुरक्षित कनेक्शन (HTTP)। भौगोलिक स्थान के लिए मोबाइल पर HTTPS (सुरक्षित कनेक्शन) होना आवश्यक है।"
            : "GPS failed: Insecure connection (HTTP). Geolocation requires a secure HTTPS connection on mobile devices."
          : language === "hi"
            ? "स्थान अनुमति अस्वीकार कर दी गई। कृपया अपनी डिवाइस सेटिंग्स में स्थान अनुमति सक्षम करें।"
            : "Location permission denied. Please enable location access in your device/browser settings.";

        toast.error(msg);
        setIsLocating(false);
      } else {
        // Try fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (fallbackErr) => {
            console.error("Geolocation failed:", fallbackErr);
            toast.error(
              language === "hi"
                ? "भौगोलिक स्थान प्राप्त करने में विफल। कृपया स्थान सेटिंग जांचें या मैन्युअल रूप से खोजें।"
                : "Unable to retrieve your location. Please check settings or search manually.",
            );
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
        );
      }
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      options,
    );
  };

  // --- MAP VIEWPORT RESIZE HANDLING (using Callback Ref) ---
  const mapRefCallback = (node: HTMLDivElement | null) => {
    if (node !== null) {
      setMapElement(node);
    }
  };

  useEffect(() => {
    if (!mapElement) return;

    const updateSize = () => {
      const rect = mapElement.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(mapElement);
    return () => observer.disconnect();
  }, [mapElement]);

  const tiles = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const centerPoint = project(center.lat, center.lng, zoom);
    const topLeftX = centerPoint.x - viewport.width / 2;
    const topLeftY = centerPoint.y - viewport.height / 2;
    const startX = Math.floor(topLeftX / TILE_SIZE);
    const endX = Math.floor((topLeftX + viewport.width) / TILE_SIZE);
    const startY = Math.floor(topLeftY / TILE_SIZE);
    const endY = Math.floor((topLeftY + viewport.height) / TILE_SIZE);
    const maxTile = 2 ** zoom;
    const mapTiles = [];

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        if (y < 0 || y >= maxTile) continue;
        const wrappedX = ((x % maxTile) + maxTile) % maxTile;
        mapTiles.push({
          x: wrappedX,
          y,
          url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
          left: x * TILE_SIZE - topLeftX,
          top: y * TILE_SIZE - topLeftY,
        });
      }
    }
    return mapTiles;
  }, [center.lat, center.lng, viewport.height, viewport.width, zoom]);

  // --- MAP DRAG TO PAN HANDLERS ---
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      lat: center.lat,
      lng: center.lng,
    };
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      const centerPoint = project(
        dragStart.current.lat,
        dragStart.current.lng,
        zoom,
      );
      const newWorldX = centerPoint.x - dx;
      const newWorldY = centerPoint.y - dy;
      const newCenter = unproject(newWorldX, newWorldY, zoom);
      setCenter(newCenter);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- TOUCH EVENTS FOR MOBILE PANNING ---
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return; // Ignore multi-touch/pinch gestures for pan
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      lat: center.lat,
      lng: center.lng,
    };
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];

    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      const centerPoint = project(
        dragStart.current.lat,
        dragStart.current.lng,
        zoom,
      );
      const newWorldX = centerPoint.x - dx;
      const newWorldY = centerPoint.y - dy;
      const newCenter = unproject(newWorldX, newWorldY, zoom);
      setCenter(newCenter);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);

  const handleConfirmCenterLocation = async () => {
    try {
      setIsConfirmingLocation(true);
      const reverse = await reverseGeocode(center.lat, center.lng);
      updateGlobalLocation(reverse);
      toast.success(locTrans.mapStatus);
    } catch {
      updateGlobalLocation({
        name: formatCoordinates(center.lat, center.lng),
        displayName: "Selected from Map",
        lat: center.lat,
        lng: center.lng,
      });
      toast.success(locTrans.mapStatus);
    } finally {
      setIsConfirmingLocation(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Revert query back to the active location name if blurred without selecting
    setQuery(location.name);
  };

  // Show loading skeleton while the client-side component initializes
  if (!mounted) {
    return (
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-card p-2 rounded-xl border border-border shadow-sm h-15">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    );
  }

  // Determine if the dropdown with search results should be shown
  const showDropdown =
    isFocused && query.trim().length >= 2 && query !== location.name;

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
      {/* 1. SEARCH BAR CONTAINER: Full width on md, fluid expansion on lg */}
      <div className="relative w-full lg:grow lg:flex-1 min-w-full md:min-w-full lg:min-w-95">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center size-4">
          {loadingResults ? (
            <Loader2 className="size-4 animate-spin text-emerald-500" />
          ) : (
            <Search className="size-4" />
          )}
        </div>
        <Input
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locTrans.searchPlaceholder}
          className="w-full pl-10 pr-10 bg-background border-border text-foreground focus-visible:ring-primary h-11 rounded-lg"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent input from losing focus when clicking the clear button
              e.preventDefault();
            }}
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}

        {/* SEARCH RESULTS DROPDOWN */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border border-border bg-popover p-2 shadow-lg max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              results.map((res) => (
                <button
                  key={res.id}
                  onMouseDown={(e) => {
                    // Prevent input blur before click handler processes
                    e.preventDefault();
                  }}
                  onClick={() => updateGlobalLocation(res)}
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                >
                  <MapPinned className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-medium">
                      {res.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {res.displayName}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {locTrans.noMatches}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. ACTION BUTTONS WRAPPER: Flex layout on all screen sizes, two stretchable buttons + one square on mobile */}
      <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
        {/* USE MY LOCATION BUTTON */}
        <Button
          variant="outline"
          onClick={handleUseLocation}
          disabled={isLocating}
          className="grow flex-1 lg:flex-none lg:w-auto h-11 rounded-lg bg-background hover:bg-accent text-foreground border-border px-3 lg:px-4"
        >
          {isLocating ? (
            <Loader2 className="size-4 animate-spin shrink-0 sm:mr-2" />
          ) : (
            <LocateFixed className="size-4 shrink-0 sm:mr-2" />
          )}
          <span className="text-xs sm:text-sm font-medium truncate">
            {/* Responsive Label Gating */}
            <span className="sm:hidden">
              {isLocating ? "..." : btnTrans.locationShort}
            </span>
            <span className="hidden sm:inline md:hidden">
              {isLocating ? locTrans.locatingState : btnTrans.locationMedium}
            </span>
            <span className="hidden md:inline">
              {isLocating ? locTrans.locatingState : locTrans.useLocationBtn}
            </span>
          </span>
        </Button>

        {/* MAP DIALOG TRIGGER */}
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogTrigger asChild>
            <Button className="grow flex-1 lg:flex-none lg:w-auto h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-3 lg:px-4">
              <MapPinned className="size-4 shrink-0 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium truncate">
                {/* Responsive Label Gating */}
                <span className="sm:hidden">{btnTrans.mapShort}</span>
                <span className="hidden sm:inline md:hidden">
                  {btnTrans.mapMedium}
                </span>
                <span className="hidden md:inline">
                  {locTrans.selectMapBtn}
                </span>
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-175 bg-background border-border p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <DialogTitle className="text-foreground">
                {locTrans.selectMapBtn}
              </DialogTitle>
            </DialogHeader>

            {/* MAP CANVAS */}
            <div
              ref={mapRefCallback}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative h-[60vh] w-full bg-muted cursor-crosshair overflow-hidden select-none touch-none"
            >
              {tiles.map((tile) => (
                <Image
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  key={`${tile.x}-${tile.y}`}
                  src={tile.url}
                  alt=""
                  className="absolute size-64 max-w-none select-none pointer-events-none"
                  style={{ left: `${tile.left}px`, top: `${tile.top}px` }}
                  draggable={false}
                />
              ))}

              {/* Center Crosshair Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <Crosshair className="size-6 text-primary drop-shadow-md" />
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 rounded-md font-bold shadow-md bg-white hover:bg-slate-100 text-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((prev) => Math.min(prev + 1, 18));
                  }}
                >
                  +
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-8 rounded-md font-bold shadow-md bg-white hover:bg-slate-100 text-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom((prev) => Math.max(prev - 1, 2));
                  }}
                >
                  -
                </Button>
              </div>
            </div>

            {/* Confirmation Footer Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground truncate max-w-[60%] font-mono">
                {formatCoordinates(center.lat, center.lng)}
              </span>
              <Button
                onClick={handleConfirmCenterLocation}
                disabled={isConfirmingLocation}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isConfirmingLocation ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Crosshair className="size-4 mr-2" />
                )}
                {locTrans.selectLocation || "Select Location"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
