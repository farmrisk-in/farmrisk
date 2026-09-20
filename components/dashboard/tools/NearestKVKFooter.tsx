"use client";

import React from "react";
import { useNearestKVK } from "@/hooks/useNearestKVK";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Landmark,
  MapPin,
  Compass,
  Building2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  LoaderCircle,
  Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KVKDetail } from "@/lib/services/kvkService";

export function NearestKVKFooter() {
  const { t } = useLanguage();
  const { kvkData, isLoading, isError } = useNearestKVK();

  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-center gap-2.5 text-muted-foreground py-8">
        <LoaderCircle className="size-5 animate-spin text-emerald-500" />
        <span className="text-xs sm:text-sm font-medium">
          Locating your nearest Krishi Vigyan Kendra (KVK)...
        </span>
      </div>
    );
  }

  if (isError || !kvkData || !kvkData.nearest) {
    return null;
  }

  const { nearest, district_kvk, same_district, query_district } = kvkData;
  const hasTwoKVKs = !same_district && Boolean(district_kvk);

  const renderKVKDetails = (
    kvk: KVKDetail,
    badgeLabel: string,
    isDistrictKVK: boolean,
  ) => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${kvk.kvk}, ${kvk.district}, ${kvk.state}`,
    )}`;

    return (
      <div
        key={kvk.kvk}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-2 last:pb-2"
      >
        <div className="flex flex-col gap-2.5 min-w-0">
          {/* Badge & Distance Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={isDistrictKVK ? "default" : "secondary"}
              className={
                isDistrictKVK
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1 shadow-xs"
                  : "bg-muted text-foreground border-border font-semibold text-xs px-3 py-1"
              }
            >
              {badgeLabel}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-0.5 rounded-md">
              <Compass className="size-3.5" />
              <span>
                ~{kvk.distance_km} km {kvk.bearing}
              </span>
            </div>
            {kvk.zone && (
              <span className="text-xs text-muted-foreground hidden md:inline font-medium">
                • {kvk.zone}
              </span>
            )}
          </div>

          {/* KVK Name & Location */}
          <div className="flex flex-col gap-1">
            <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
              {kvk.kvk}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <MapPin className="size-3.5 text-emerald-500 shrink-0" />
              <span>
                {kvk.district}, {kvk.state}
              </span>
            </p>
          </div>

          {/* Host & Sanction Info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground/80 shrink-0" />
              <span className="text-xs">
                <strong className="text-foreground/90 font-medium">
                  {t.tools?.kvkHostOrg || "Host"}:
                </strong>{" "}
                {kvk.host}
              </span>
            </div>
            {kvk.year_of_sanction && (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground/80 shrink-0" />
                <span className="text-xs">
                  <strong className="text-foreground/90 font-medium">
                    {t.tools?.kvkSanctioned || "Sanctioned"}:
                  </strong>{" "}
                  {kvk.year_of_sanction} ({kvk.host_type || "ICAR"})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 self-start sm:self-center sm:pl-4">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-9 px-3.5 text-xs font-semibold gap-2 border-border hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 cursor-pointer shadow-2xs"
          >
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="size-3.5 text-emerald-500" />
              <span>{t.tools?.kvkDirections || "Directions / Map"}</span>
              <ExternalLink className="size-3 opacity-60 ml-0.5" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-5 mt-3">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
            <Landmark className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              {t.tools?.kvkGuidanceTitle || "Need Local Agricultural Guidance?"}
            </h3>
            <p className="text-xs sm:text-[13px] text-muted-foreground max-w-3xl leading-relaxed">
              {t.tools?.kvkGuidanceSubtitle ||
                "We encourage you to visit your nearest Krishi Vigyan Kendra (KVK) for certified seed testing, soil fertility health cards, practical field demonstrations, and personalized agronomic extension support."}
            </p>
          </div>
        </div>

        {query_district && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/80 text-foreground border border-border text-xs font-semibold shrink-0 self-start">
            <MapPin className="size-3.5 text-emerald-500" />
            <span>{query_district} District</span>
          </div>
        )}
      </div>

      {/* Cross-district note banner if query falls in border zone */}
      {hasTwoKVKs && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>
            {t.tools?.kvkAdministrativeNote ||
              "Agricultural extension services and state subsidy programs typically follow administrative district boundaries. We recommend contacting your district's designated KVK first."}
          </span>
        </div>
      )}

      {/* KVK List with consistent spacing */}
      <div className="flex flex-col divide-y divide-border/60">
        {district_kvk &&
          renderKVKDetails(
            district_kvk,
            t.tools?.kvkDistrictBadge || "Your District's KVK (Recommended)",
            true,
          )}

        {nearest &&
          renderKVKDetails(
            nearest,
            hasTwoKVKs
              ? t.tools?.kvkNearestBadge || "Nearest KVK (Neighbouring District)"
              : t.tools?.kvkDistrictBadge || "Nearest KVK",
            !hasTwoKVKs,
          )}
      </div>
    </div>
  );
}

export default NearestKVKFooter;
