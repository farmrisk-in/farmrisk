"use client";

import { useLocationContext } from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/use-language";
import { CloudOff, Expand, LoaderCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWeather } from "@/hooks/useWeather";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Drawing } from "@/components/ui/drawing";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => {
    // Cannot easily useLanguage here because it's outside provider in some contexts, but this is fine to hardcode or we could pass it. Let's just hardcode the loading state here as it's a dynamic import fallback.
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
        <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs">Loading Interactive Map...</span>
      </div>
    );
  },
});

export const Lightning = () => {
  const { location, isResolving } = useLocationContext();
  const { t } = useLanguage();
  const { lightning, isLoading, isError } = useWeather();
  const [isOpen, setIsOpen] = useState(false);
  let zoom = 14;
  if (lightning?.color === "green") zoom = 14;
  if (lightning?.color === "yellow") zoom = 13;
  if (lightning?.color === "orange") zoom = 12;
  if (lightning?.color === "red") zoom = 11;
  if (isResolving || isLoading) {
    return (
      <div className="w-full h-80 min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 pb-0 select-none flex flex-col">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
          <Zap className="size-4.5" />
          {t.dashboard?.lightningRisk || "LIGHTNING RISK"}
        </div>
        <div className="w-full grow flex items-center justify-center gap-2 text-muted-foreground select-none">
          <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm font-medium">
            {t.dashboard?.loadingMap || "Fetching Lightning Risk Data..."}
          </span>
        </div>
      </div>
    );
  }

  if (isError || !lightning || !location) {
    return (
      <div className="w-full h-80 min-w-0 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 pb-0 select-none flex flex-col">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
          <Zap className="size-4.5" />
          {t.dashboard?.lightningRisk || "LIGHTNING RISK"}
        </div>
        <div className="w-full grow flex items-center justify-center gap-2 text-muted-foreground select-none">
          <CloudOff className="size-6" />
          <span className="text-sm font-medium">Something went wrong</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80 relative rounded-xl overflow-hidden border border-border bg-muted/20">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {!isOpen && (
          <Map
            initialLat={location.lat}
            initialLng={location.lng}
            title={t.dashboard?.lightningRisk || "Lightning Risk"}
            showZoomControls={false}
            showCenterIndicator={false}
            doubleClickZoom={false}
            boxZoom={false}
            Icon={Zap}
            dialog={false}
            zoom={zoom - 1}
            bottomLeftBadge={
              <Badge
                className={`rounded-sm`}
                style={{ backgroundColor: lightning.color }}
              >
                {(lightning.category === "Low" && t.dashboard?.advLow) ||
                  (lightning.category === "Moderate" &&
                    t.dashboard?.advModerate) ||
                  (lightning.category === "High" && t.dashboard?.advHigh) ||
                  (lightning.category === "Severe" && t.dashboard?.advSevere) ||
                  lightning.advisory}
              </Badge>
            }
            topRightAction={
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto text-white bg-black/10"
                >
                  <Expand className="size-4.5" />
                </Button>
              </DialogTrigger>
            }
          >
            <Drawing data={lightning} location={location} t={t} />
          </Map>
        )}
        <DialogContent className="p-0 bg-background border-border rounded-xl overflow-hidden w-[80%] sm:max-w-full gap-0">
          <Map
            initialLat={location.lat}
            initialLng={location.lng}
            showCenterIndicator={false}
            title={t.dashboard?.lightningRisk || "Lightning Risk"}
            Icon={Zap}
            zoom={zoom}
            dialog={true}
            bottomLeftBadge={
              <Badge
                className={`rounded-sm`}
                style={{ backgroundColor: lightning.color }}
              >
                {(lightning.category === "Low" && t.dashboard?.advLow) ||
                  (lightning.category === "Moderate" &&
                    t.dashboard?.advModerate) ||
                  (lightning.category === "High" && t.dashboard?.advHigh) ||
                  (lightning.category === "Severe" && t.dashboard?.advSevere) ||
                  lightning.advisory}
              </Badge>
            }
          >
            <Drawing data={lightning} location={location} t={t} />
          </Map>
        </DialogContent>
      </Dialog>
    </div>
  );
};
