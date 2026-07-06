"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, LucideProps } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { ReactNode } from "react";
import { useIsDarkMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export interface LeafletSelectMapProps {
  initialLat: number;
  initialLng: number;
  onCenterChange?: (lat: number, lng: number) => void;
  title?: string;
  bottomLeftBadge?: ReactNode;
  bottomRightAction?: ReactNode;
  topRightAction?: ReactNode;
  children?: ReactNode;
  zoom?: number;
  draggable?: boolean;
  scrollWheelZoom?: boolean;
  doubleClickZoom?: boolean;
  touchZoom?: boolean;
  keyboard?: boolean;
  dialog?: boolean;
  boxZoom?: boolean;
  showCenterIndicator?: boolean;
  showZoomControls?: boolean;
  Icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >; // Optional icon for the top-left corner
}

const INITIAL_ZOOM = 11;

function MapEvents({
  onCenterChange,
}: {
  onCenterChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleMove = () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    };

    map.on("move", handleMove);

    // Explicit block braces prevent the implicit return of the Map instance
    return () => {
      map.off("move", handleMove);
    };
  }, [map, onCenterChange]);

  return null;
}

function InvalidateMapSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function CustomZoomControl() {
  const map = useMap();
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-1000">
      <Button
        size="icon"
        variant="outline"
        type="button"
        className="size-10 rounded-md font-bold shadow-md bg-background/80 backdrop-blur-xs border-border text-foreground hover:bg-accent pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          map.zoomIn();
        }}
      >
        +
      </Button>
      <Button
        size="icon"
        variant="outline"
        type="button"
        className="size-10 rounded-md font-bold shadow-md bg-background/80 backdrop-blur-xs border-border text-foreground hover:bg-accent pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          map.zoomOut();
        }}
      >
        -
      </Button>
    </div>
  );
}

export default function Map({
  initialLat,
  initialLng,
  onCenterChange,
  title,
  topRightAction,
  Icon,
  bottomLeftBadge,
  bottomRightAction,
  children,
  zoom = INITIAL_ZOOM,
  draggable = true,
  scrollWheelZoom = true,
  doubleClickZoom = true,
  touchZoom = true,
  keyboard = true,
  dialog = false,
  boxZoom = true,
  showCenterIndicator = true,
  showZoomControls = true,
}: LeafletSelectMapProps) {
  // High-performance map layer selection matching your standard context

  const isDark = useIsDarkMode();

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const newLocal =
    "absolute top-0 left-0 w-full pt-4 pb-12 px-6 bg-linear-to-b from-black/70 via-black/20 to-transparent pointer-events-none z-1000 flex items-center justify-between";
  return (
    <div
      className={cn(
        "relative w-full cursor-crosshair overflow-hidden select-none touch-none bg-background",
        dialog ? "h-[80vh]" : "h-full",
      )}
    >
      {/* NATIVE MAP CANVAS CANCHOR */}
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        dragging={draggable}
        scrollWheelZoom={scrollWheelZoom}
        doubleClickZoom={doubleClickZoom}
        touchZoom={touchZoom}
        keyboard={keyboard}
        boxZoom={boxZoom}
        style={{
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundColor: "var(--background)",
        }}
        key="map-container"
      >
        <TileLayer key={isDark ? "dark" : "light"} url={tileUrl} />
        <Recenter lat={initialLat} lng={initialLng} />
        {onCenterChange && <MapEvents onCenterChange={onCenterChange} />}
        <InvalidateMapSize />
        {showZoomControls && <CustomZoomControl />}
        {children}
      </MapContainer>

      {/* CENTER POSITION INDICATOR */}
      {showCenterIndicator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-1000">
          <Crosshair className="size-7 text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </div>
      )}
      {/* TOP VIGNETTE OVERLAY CONTROL LAYER */}
      <div className={newLocal}>
        <div className="flex items-center gap-2 text-white text-sm font-semibold tracking-wide drop-shadow-xs select-none">
          {Icon && <Icon size={20} />}
          <h3 className="text-white font-semibold text-base tracking-wide drop-shadow-xs select-none">
            {title || "Map"}
          </h3>
        </div>
        {topRightAction}
      </div>

      {/* BOTTOM VIGNETTE OVERLAY CONTROL LAYER */}
      <div className="absolute bottom-0 left-0 w-full pt-2 pb-4 px-6 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-1 flex items-center justify-between">
        {bottomLeftBadge}
        {bottomRightAction}
      </div>
    </div>
  );
}
