"use client";

import React, { useEffect, useState } from "react";
import { useLocationContext } from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/use-language";
import { LoaderCircle, MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./LightningMap"), {
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

interface LightningData {
  risk: {
    score: number;
    category: string;
    color: "green" | "yellow" | "orange" | "red";
    advisory: string;
  };
  factors: {
    cloudCover: number;
    precipitation: number;
    humidity: number;
    windGusts: number;
    weatherCode: number;
  };
  lastUpdated: string;
}

export const LightningMonitoring = () => {
  const { location, isResolving } = useLocationContext();
  const { t } = useLanguage();
  const { resolvedTheme, theme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  
  const [data, setData] = useState<LightningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDark = () => {
      return (
        resolvedTheme === "dark" || 
        theme === "dark" || 
        document.documentElement.classList.contains("dark")
      );
    };
    
    setIsDark(checkDark());
    
    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [resolvedTheme, theme]);

  useEffect(() => {
    if (isResolving || !location || !location.lat || !location.lng) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/lightning?lat=${location.lat}&lng=${location.lng}`);
        if (!res.ok) {
          throw new Error("Failed to fetch lightning risk data");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.lat, location.lng, isResolving]);

  if (!location || !location.lat || !location.lng || isResolving || loading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-medium">{t.dashboard?.loadingRisk || "Loading Risk Data..."}</span>
      </div>
    );
  }

  const textColor = isDark ? "#cbd5e1" : "#64748b";
  const componentTitle = t.dashboard?.lightningRisk || "LIGHTNING RISK";

  const renderLegendItem = (category: string, label: string, colorClass: string, shadowColor: string) => {
    const isCurrent = data?.risk.category === category;
    return (
      <div style={{ color: isDark ? textColor : undefined }} className={`flex items-center gap-1.5 text-[0.7rem] font-medium transition-all duration-300 ${isCurrent ? 'opacity-100 scale-105 font-bold text-foreground' : 'opacity-60'}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${colorClass} ${isCurrent ? `shadow-[0_0_8px_${shadowColor}] ring-2 ring-offset-1 ring-offset-background ring-${colorClass.replace('bg-', '')}` : ''}`}></div>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm select-none flex flex-col h-full relative z-0">
      <div style={{ color: isDark ? textColor : undefined }} className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1.5 mb-4 flex items-center justify-between">
        <span>{componentTitle}</span>
      </div>

      <div className="h-[260px] w-full mt-2 relative rounded-xl overflow-hidden border border-border bg-muted/20">
        
        {/* Dynamic Leaflet Map */}
        <DynamicMap 
          lat={location.lat} 
          lng={location.lng} 
          locationName={location.name || location.displayName.split(',')[0]} 
          isDark={isDark} 
          data={data} 
          t={t}
        />

        {/* Info Card Overlay matching the reference image's floating box */}
        <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-md border border-border rounded-lg p-2.5 shadow-md flex flex-col gap-1 z-[1000] pointer-events-none">
          <div className="flex items-center justify-between">
             <span className="text-sm font-semibold text-foreground truncate mr-2 flex items-center gap-1.5">
               <MapPin className="w-3.5 h-3.5 text-primary" />
               {location.name || location.displayName.split(',')[0]}
             </span>
             {data && (
               <span className={`text-xs font-bold px-1.5 py-0.5 rounded capitalize ${
                  data.risk.color === 'green' ? 'bg-emerald-500/15 text-emerald-500' :
                  data.risk.color === 'yellow' ? 'bg-amber-500/15 text-amber-500' :
                  data.risk.color === 'orange' ? 'bg-orange-500/15 text-orange-500' :
                  'bg-rose-500/15 text-rose-500'
               }`}>
                 {data.risk.category === 'Low' && t.dashboard?.riskLow || 
                  data.risk.category === 'Moderate' && t.dashboard?.riskModerate || 
                  data.risk.category === 'High' && t.dashboard?.riskHigh || 
                  data.risk.category === 'Severe' && t.dashboard?.riskSevere || 
                  data.risk.category} {t.dashboard?.riskLevel || "Risk"}
               </span>
             )}
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight">
            {error ? (
               <span className="text-destructive">{t.dashboard?.fetchRiskError || "Failed to fetch risk data."}</span>
            ) : data ? (
               <>{data.risk.category === 'Low' && t.dashboard?.advLow || 
                  data.risk.category === 'Moderate' && t.dashboard?.advModerate || 
                  data.risk.category === 'High' && t.dashboard?.advHigh || 
                  data.risk.category === 'Severe' && t.dashboard?.advSevere || 
                  data.risk.advisory}</>
            ) : (
               t.dashboard?.noData || "No data available."
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center mt-6 pl-2 flex-wrap relative z-[1000]">
        {renderLegendItem('Low', t.dashboard?.riskLow || "Low", 'bg-emerald-500', 'rgba(16,185,129,0.5)')}
        {renderLegendItem('Moderate', t.dashboard?.riskModerate || "Moderate", 'bg-amber-500', 'rgba(245,158,11,0.5)')}
        {renderLegendItem('High', t.dashboard?.riskHigh || "High", 'bg-orange-500', 'rgba(249,115,22,0.5)')}
        {renderLegendItem('Severe', t.dashboard?.riskSevere || "Severe", 'bg-rose-500', 'rgba(244,63,94,0.5)')}
      </div>
    </div>
  );
};
