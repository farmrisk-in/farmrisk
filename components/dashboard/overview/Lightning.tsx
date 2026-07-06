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
import { LightningData } from "@/types/weather";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => {
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
  const { data, isLoading, isError } = useWeather();
  const lightning = data?.lightning;
  const [isOpen, setIsOpen] = useState(false);

  const getLightningDetails = (category: string | undefined) => {
    switch (category) {
      case "Severe":
        return {
          color: "#FF040E",
          advisory: t.dashboard?.advSevere || "Severe risk of lightning.",
          zoom: 11,
        };
      case "High":
        return {
          color: "#FF4116",
          advisory: t.dashboard?.advHigh || "High risk of lightning.",
          zoom: 12,
        };
      case "Moderate":
        return {
          color: "##FF9C04",
          advisory: t.dashboard?.advModerate || "Moderate risk of lightning.",
          zoom: 13,
        };
      case "Low":
      default:
        return {
          color: "#006045",
          advisory: t.dashboard?.advLow || "Low risk of lightning.",
          zoom: 14,
        };
    }
  };

  const { color, advisory, zoom } = getLightningDetails(lightning?.category);

  const mappedLightning: LightningData | undefined = lightning
    ? {
        score: lightning.score,
        category: lightning.category,
        color,
        advisory,
      }
    : undefined;

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

  if (isError || !lightning || !location || !mappedLightning) {
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
                style={{ backgroundColor: color }}
              >
                {(lightning.category === "Low" && t.dashboard?.advLow) ||
                  (lightning.category === "Moderate" &&
                    t.dashboard?.advModerate) ||
                  (lightning.category === "High" && t.dashboard?.advHigh) ||
                  (lightning.category === "Severe" && t.dashboard?.advSevere) ||
                  advisory}
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
            <Drawing data={mappedLightning} location={location} t={t} />
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
                style={{ backgroundColor: color }}
              >
                {(lightning.category === "Low" && t.dashboard?.advLow) ||
                  (lightning.category === "Moderate" &&
                    t.dashboard?.advModerate) ||
                  (lightning.category === "High" && t.dashboard?.advHigh) ||
                  (lightning.category === "Severe" && t.dashboard?.advSevere) ||
                  advisory}
              </Badge>
            }
          >
            <Drawing data={mappedLightning} location={location} t={t} />
          </Map>
        </DialogContent>
      </Dialog>
    </div>
  );
};
