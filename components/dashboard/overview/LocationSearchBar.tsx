/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { MapPinned, LocateFixed, X, Crosshair, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { useLanguage } from "@/hooks/useLanguage";
import { useLocationSearch } from "@/hooks/useLocations";
import {
  useLocationContext,
  type SelectedLocation,
} from "@/providers/LocationProvider";

import { reverseGeocode, formatCoordinates } from "@/lib/utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-sm font-medium">Loading Select Map...</span>
    </div>
  ),
});

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
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const shouldSearch =
    debouncedQuery.trim().length >= 2 &&
    debouncedQuery.trim() !== location.name;
  const { data: results = [], isFetching: loadingResults } = useLocationSearch(
    shouldSearch ? debouncedQuery : "",
  );

  const [isLocating, setIsLocating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Map Dialog State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [center, setCenter] = useState({
    lat: location.lat,
    lng: location.lng,
  });

  // Client-side mount check to prevent visual lag/layout shifts during hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize input query when the location name changes globally (e.g. from GPS or Map)
  useEffect(() => {
    setQuery(location.name);
  }, [location.name]);

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

  const handleCenterChange = (lat: number, lng: number) => {
    setCenter({ lat, lng });
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

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
      <Command shouldFilter={false} className="p-0 rounded-md h-11">
        <Popover open={isFocused}>
          <div className="relative w-full lg:grow lg:flex-1 min-w-full md:min-w-full lg:min-w-95">
            <PopoverAnchor asChild className="h-11">
              <div className="relative">
                <CommandInput
                  value={query}
                  onFocus={() => setIsFocused(true)}
                  onBlur={handleBlur}
                  onValueChange={(value) => setQuery(value)}
                  placeholder={locTrans.searchPlaceholder}
                />

                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setQuery("")}
                    className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-full"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </PopoverAnchor>

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-(--radix-popover-trigger-width) p-2 bg-background"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <CommandList className="max-h-72">
                {loadingResults ? (
                  <div className="flex bg-background rounded-xl items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <CommandEmpty className="bg-background rounded-xl">
                    {locTrans.noMatches}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {results.map((res, _) => (
                      <CommandItem
                        key={_}
                        value={`${res.id}-${res.name}-${res.lat}-${res.lng}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onSelect={() => {
                          updateGlobalLocation(res);
                          setIsFocused(false);
                        }}
                        className="cursor-pointer py-3 bg-background rounded-xl"
                      >
                        <MapPinned className="mr-3 size-7 shrink-0" />

                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
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
          <DialogContent className="p-0 bg-background border-border rounded-xl overflow-hidden w-[80%] sm:max-w-full gap-0">
            {/* EDGE-TO-EDGE INTUITIVE MAP CONTAINER MODULE */}
            <Map
              Icon={MapPinned}
              initialLat={location.lat}
              initialLng={location.lng}
              onCenterChange={handleCenterChange}
              title={locTrans.selectMapBtn || "Verify Farm Coordinates"}
              dialog={true}
              bottomLeftBadge={
                <Badge className="rounded-sm" variant="outline">
                  <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                  {formatCoordinates(center.lat, center.lng)}
                </Badge>
              }
              bottomRightAction={
                <Button
                  onClick={handleConfirmCenterLocation}
                  disabled={isConfirmingLocation}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 font-medium tracking-wide shadow-md transition-all active:scale-98 cursor-pointer border border-emerald-500/30 h-10 px-4"
                >
                  {isConfirmingLocation ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <Crosshair className="size-4 mr-2" />
                  )}
                  {locTrans.selectLocation || "Select Location"}
                </Button>
              }
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
