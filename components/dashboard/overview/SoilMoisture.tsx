"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import { useLocationContext } from "@/providers/LocationProvider";

import { useLanguage } from "@/hooks/use-language";
import { LoaderCircle } from "lucide-react";
import { useTheme } from "next-themes";

// --- TYPES ---
interface SoilMoistureData {
  date: string;
  pcp: number;
  tmax: number;
  tmin: number;
  w: number;
  sm_percentile: number;
  is_forecast: number;
}

interface SoilMoistureResponse {
  metadata: {
    lat: number;
    lon: number;
    WMAX: number;
    Bm: number;
    spinup_years_used: number;
  };
  data: SoilMoistureData[];
}

// --- COLOR & CATEGORY MAPPING ---
// Maps strictly to the "Expert View" table
const getCategoryAndColor = (pct: number, t?: any) => {
  if (pct > 98) return { label: t?.dashboard?.smExceptionalWet || "Exceptional Wet", color: "#0284c7" };
  if (pct > 95) return { label: t?.dashboard?.smExtremeWet || "Extreme Wet", color: "#0ea5e9" };
  if (pct > 90) return { label: t?.dashboard?.smSevereWet || "Severe Wet", color: "#7dd3fc" };
  if (pct > 80) return { label: t?.dashboard?.smModerateWet || "Moderate Wet", color: "#bae6fd" };
  if (pct > 70) return { label: t?.dashboard?.smAbnormallyWet || "Abnormally Wet", color: "#e0f2fe" };
  if (pct > 30) return { label: t?.dashboard?.smNormal || "Normal", color: "#cbd5e1" }; 
  if (pct > 20) return { label: t?.dashboard?.smAbnormallyDry || "Abnormally Dry", color: "#fed7aa" }; 
  if (pct > 10) return { label: t?.dashboard?.smModerateDry || "Moderate Dry", color: "#fdba74" };
  if (pct > 5) return { label: t?.dashboard?.smExtremeDry || "Extreme Dry", color: "#f97316" };
  if (pct > 2) return { label: t?.dashboard?.smSevereDry || "Severe Dry", color: "#ea580c" };
  return { label: t?.dashboard?.smExceptionalDry || "Exceptional Dry", color: "#9a3412" };
};

// --- CUSTOM DOT ---
const CustomDot = (props: any) => {
  const { cx, cy, payload, isDark } = props;
  const { color } = getCategoryAndColor(payload.sm_percentile); // Color doesn't need translation

  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke={isDark ? "hsl(var(--card))" : "#fff"} strokeWidth={1.5} />
  );
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, isDark, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { label: category } = getCategoryAndColor(data.sm_percentile, t);
    const dateStr = new Date(data.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();

    return (
      <div 
        className="bg-popover border border-border rounded-md px-4 py-3 shadow-md min-w-[140px]"
        style={{
          backgroundColor: isDark ? "#1e293b" : undefined,
          borderColor: isDark ? "rgba(255,255,255,0.2)" : undefined
        }}
      >
        <div className="font-bold text-[0.95rem] text-popover-foreground">
          {dateStr}
        </div>
        <div style={{ color: isDark ? "#cbd5e1" : undefined }} className="text-muted-foreground text-[0.85rem] mb-3">
          {category}
        </div>
        <div className="font-bold text-[1.1rem] text-popover-foreground">
          {data.sm_percentile.toFixed(2)}%
        </div>
        <div style={{ color: isDark ? "#cbd5e1" : undefined }} className="text-foreground text-[0.9rem] font-medium">
          {t?.dashboard?.smPercentiles || "Percentiles"}
        </div>
      </div>
    );
  }
  return null;
};

export default function SoilMoisture() {
  const { location } = useLocationContext();
  const { t } = useLanguage();
  
  const { resolvedTheme, theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Bulletproof dark mode check that bypasses next-themes cache bugs
    const checkDark = () => {
      return (
        resolvedTheme === "dark" || 
        theme === "dark" || 
        document.documentElement.classList.contains("dark")
      );
    };
    
    setIsDark(checkDark());
    
    // Optional: observer to watch for class changes on HTML tag
    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [resolvedTheme, theme]);

  const [data, setData] = useState<SoilMoistureResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location || !location.lat || !location.lng) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchSoilMoisture = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/soil-moisture?lat=${location.lat}&lon=${location.lng}&days=16`,
          { signal }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Failed to fetch soil moisture data.");
        }

        const result: SoilMoistureResponse = await response.json();
        setData(result);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Soil moisture fetch aborted");
        } else {
          console.error("Soil moisture fetch error:", err);
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSoilMoisture();

    return () => {
      controller.abort();
    };
  }, [location?.lat, location?.lng]);

  const chartData = useMemo(() => {
    if (!data || !data.data) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return data.data.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= thirtyDaysAgo;
    });
  }, [data]);

  const todayRecord = useMemo(() => {
    if (!chartData.length) return null;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return chartData.find(d => d.date === todayStr || d.is_forecast === 1) || chartData[0];
  }, [chartData]);


  if (!location || !location.lat || !location.lng) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground text-sm">
          Select a location to view soil moisture.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <LoaderCircle className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs font-medium">Analyzing soil hydrology...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-card border border-l-4 border-l-red-500 border-border rounded-xl p-4 shadow-sm">
        <h3 className="text-red-500 font-semibold mb-2">Analysis Failed</h3>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Use translations if available, fallback to hardcoded string
  const componentTitle = (t.dashboard as any)?.soilMoisture || "SOIL MOISTURE";

  const gridColor = isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0";
  const trendColor = isDark ? "#ffffff" : "#0f172a";
  const todayColor = isDark ? "#ffffff" : "#000";
  const textColor = isDark ? "#cbd5e1" : "#64748b";

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm select-none flex flex-col">
      <div style={{ color: isDark ? textColor : undefined }} className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1.5 mb-4">
        {componentTitle}
      </div>

      <div className="h-[260px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={isDark ? "dark" : "light"} data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
            <ReferenceLine y={50} stroke={gridColor} strokeDasharray="3 3" />
            <ReferenceLine y={25} stroke={gridColor} strokeDasharray="3 3" />
            <ReferenceLine y={75} stroke={gridColor} strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={!isDark}
              tick={{ fill: textColor, fontSize: 12 }}
              dy={10}
              minTickGap={50}
            />

            <Tooltip
              content={<CustomTooltip isDark={isDark} t={t} />}
              cursor={{ stroke: isDark ? '#ffffff' : '#cbd5e1', strokeWidth: 1, strokeDasharray: "4 4" }}
            />

            {todayRecord && (
              <ReferenceLine
                x={todayRecord.date}
                stroke={todayColor}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                className={isDark ? "stroke-white text-white" : ""}
                style={{ stroke: todayColor }}
              />
            )}

            <Line
              type="linear"
              dataKey="sm_percentile"
              stroke={trendColor}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={<CustomDot isDark={isDark} />}
              activeDot={{ r: 7, strokeWidth: 0 }}
              isAnimationActive={false}
              className={isDark ? "stroke-white text-white" : ""}
              style={{ stroke: trendColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-6 items-center mt-6 pl-2">
        <div style={{ color: isDark ? textColor : undefined }} className="flex items-center gap-2 text-[0.75rem] text-muted-foreground font-medium">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span>{(t.dashboard as any)?.smPercentileLegend || "Percentile (colour = category)"}</span>
        </div>
        <div style={{ color: isDark ? textColor : undefined }} className="flex items-center gap-2 text-[0.75rem] text-muted-foreground font-medium">
          <div className="w-5 h-[1.5px] bg-foreground border border-dashed border-muted-foreground"></div>
          <span>{(t.dashboard as any)?.smTrend || "Trend"}</span>
        </div>
        <div style={{ color: isDark ? textColor : undefined }} className="flex items-center gap-2 text-[0.75rem] text-muted-foreground font-medium border-l border-border pl-6">
          <div className="w-[1.5px] h-3 bg-foreground border border-dashed border-muted-foreground"></div>
          <span>{(t.dashboard as any)?.today || "Today"}</span>
        </div>
      </div>
    </div>
  );
}
