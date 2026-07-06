"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

import { useLocationContext } from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { useForecast } from "@/hooks/useForecast";
import {
  LoaderCircle,
  CloudOff,
  Settings,
  Droplets,
  Percent,
  CloudRain,
  Wind,
  Sun,
  Waves,
  Download,
} from "lucide-react";
import { TranslationType } from "@/constants/content";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// --- CONFIGURABLE: number of data points visible at once ---
const VISIBLE_POINTS = 25;

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    sm_percentile: number;
  };
  isDark?: boolean;
}

// --- COLOR & CATEGORY MAPPING ---
// Maps strictly to the "Expert View" table, utilizing Tailwind CSS variable values
const getCategoryAndColor = (pct: number, t?: TranslationType) => {
  if (pct > 98)
    return {
      label: t?.dashboard?.smExceptionalWet || "Exceptional Wet",
      color: "var(--color-sky-600)",
    };
  if (pct > 95)
    return {
      label: t?.dashboard?.smExtremeWet || "Extreme Wet",
      color: "var(--color-sky-500)",
    };
  if (pct > 90)
    return {
      label: t?.dashboard?.smSevereWet || "Severe Wet",
      color: "var(--color-sky-300)",
    };
  if (pct > 80)
    return {
      label: t?.dashboard?.smModerateWet || "Moderate Wet",
      color: "var(--color-sky-200)",
    };
  if (pct > 70)
    return {
      label: t?.dashboard?.smAbnormallyWet || "Abnormally Wet",
      color: "var(--color-sky-100)",
    };
  if (pct > 30)
    return {
      label: t?.dashboard?.smNormal || "Normal",
      color: "var(--muted-foreground)",
    };
  if (pct > 20)
    return {
      label: t?.dashboard?.smAbnormallyDry || "Abnormally Dry",
      color: "var(--color-orange-200)",
    };
  if (pct > 10)
    return {
      label: t?.dashboard?.smModerateDry || "Moderate Dry",
      color: "var(--color-orange-300)",
    };
  if (pct > 5)
    return {
      label: t?.dashboard?.smExtremeDry || "Extreme Dry",
      color: "var(--color-orange-500)",
    };
  if (pct > 2)
    return {
      label: t?.dashboard?.smSevereDry || "Severe Dry",
      color: "var(--color-orange-600)",
    };
  return {
    label: t?.dashboard?.smExceptionalDry || "Exceptional Dry",
    color: "var(--color-orange-800)",
  };
};

// --- CUSTOM DOT ---
const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const { color } = getCategoryAndColor(payload.sm_percentile);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke={"var(--foreground)"}
      strokeWidth={1}
    />
  );
};

// --- CUSTOM TOOLTIP ---
interface CustomTooltipPayloadItem {
  dataKey: string;
  value: number;
  stroke: string;
  payload: {
    date: string;
    sm_percentile: number;
    w: number;
    P_obs: number;
    PE: number;
    E: number;
    R: number;
    G: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  t: TranslationType;
}

const CustomTooltip = ({ active, payload, t }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateStr = new Date(data.date)
      .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      .toUpperCase();

    return (
      <div className="bg-popover border border-border rounded-md px-3.5 py-2.5 shadow-md min-w-40 space-y-1.5 text-xs text-popover-foreground">
        <div className="font-bold text-muted-foreground border-b pb-1">
          {dateStr}
        </div>
        {payload.map((entry) => {
          const key = entry.dataKey as string;
          const value = entry.value as number;
          const color = entry.stroke || "currentColor";

          let name = key;
          let formattedValue =
            typeof value === "number" ? value.toFixed(1) : value;

          if (key === "sm_percentile") {
            const { label: category } = getCategoryAndColor(value, t);
            name = `Soil Percentile (${category})`;
            formattedValue = `${value.toFixed(1)}%`;
          } else if (key === "w") {
            name = "Soil Volume";
            formattedValue = `${value.toFixed(1)} mm`;
          } else if (key === "P_obs") {
            name = "Precipitation";
            formattedValue = `${value.toFixed(1)} mm`;
          } else if (key === "PE") {
            name = "Potential Evap";
            formattedValue = `${value.toFixed(1)} mm`;
          } else if (key === "E") {
            name = "Actual Evap";
            formattedValue = `${value.toFixed(1)} mm`;
          } else if (key === "R") {
            name = "Runoff";
            formattedValue = `${value.toFixed(1)} mm`;
          } else if (key === "G") {
            name = "Deep Drainage";
            formattedValue = `${value.toFixed(1)} mm`;
          }

          return (
            <div key={key} className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {name}
              </span>
              <span className="font-bold">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const SERIES_COLORS: Record<string, string> = {
  sm_percentile: "var(--color-emerald-500)",
  w: "var(--color-sky-500)",
  P_obs: "var(--color-blue-500)",
  PE: "var(--color-amber-500)",
  E: "var(--color-purple-500)",
  R: "var(--color-rose-500)",
  G: "var(--color-teal-500)",
};

const SERIES_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  sm_percentile: Percent,
  w: Droplets,
  P_obs: CloudRain,
  PE: Wind,
  E: Sun,
  R: Waves,
  G: Download,
};

export default function SoilMoisture() {
  const { location, isResolving } = useLocationContext();
  const { t } = useLanguage();
  const [charts, setCharts] = useState({
    P_obs: false,
    PE: false,
    w: false,
    E: false,
    R: false,
    G: false,
    sm_percentile: true,
  });
  const [isDark] = useState(false);

  const { data: report, isLoading, isError } = useForecast();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const soilMoistureData = report?.soil_moisture?.soil_moisture || [];

  const chartData = useMemo(() => {
    if (!soilMoistureData || soilMoistureData.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return soilMoistureData.filter((d) => {
      const dDate = new Date(d.date);
      return dDate >= thirtyDaysAgo;
    });
  }, [soilMoistureData]);

  // --- SCROLLABLE WINDOW STATE ---
  const totalPoints = chartData.length;
  const maxOffset = Math.max(0, totalPoints - VISIBLE_POINTS);

  // Default: scroll to end so "today" / forecast is visible
  const [scrollOffset, setScrollOffset] = useState<number | null>(null);
  const resolvedOffset = useMemo(() => {
    if (scrollOffset !== null) return scrollOffset;
    // Auto-position: show the latest data (right-aligned)
    return maxOffset;
  }, [scrollOffset, maxOffset]);

  const visibleData = useMemo(() => {
    if (totalPoints <= VISIBLE_POINTS) return chartData;
    return chartData.slice(resolvedOffset, resolvedOffset + VISIBLE_POINTS);
  }, [chartData, resolvedOffset, totalPoints]);

  // --- STEP SCROLL (Arrow buttons) ---
  const handleStepLeft = useCallback(() => {
    setScrollOffset((prev) => {
      const current = prev ?? maxOffset;
      return Math.max(0, current - 3);
    });
  }, [maxOffset]);

  const handleStepRight = useCallback(() => {
    setScrollOffset((prev) => {
      const current = prev ?? maxOffset;
      return Math.min(maxOffset, current + 3);
    });
  }, [maxOffset]);

  // --- WHEEL-TO-SCROLL ---
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (totalPoints <= VISIBLE_POINTS) return;
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const step = delta > 0 ? 2 : -2;
      setScrollOffset((prev) => {
        const current = prev ?? maxOffset;
        return Math.min(maxOffset, Math.max(0, current + step));
      });
    },
    [totalPoints, maxOffset],
  );

  // --- SCROLLBAR THUMB DRAG ---
  const trackRef = useRef<HTMLDivElement>(null);
  const isThumbDragging = useRef(false);

  const thumbWidthPct = totalPoints > 0 ? Math.min(100, (VISIBLE_POINTS / totalPoints) * 100) : 100;
  const thumbLeftPct = maxOffset > 0 ? (resolvedOffset / maxOffset) * (100 - thumbWidthPct) : 0;

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (totalPoints <= VISIBLE_POINTS || !trackRef.current) return;
      isThumbDragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = trackRef.current.getBoundingClientRect();
      const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
      const newOffset = Math.round((clickPct / (100 - thumbWidthPct)) * maxOffset);
      setScrollOffset(Math.min(maxOffset, Math.max(0, newOffset)));
    },
    [totalPoints, maxOffset, thumbWidthPct],
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isThumbDragging.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
      const newOffset = Math.round((clickPct / (100 - thumbWidthPct)) * maxOffset);
      setScrollOffset(Math.min(maxOffset, Math.max(0, newOffset)));
    },
    [maxOffset, thumbWidthPct],
  );

  const handleTrackPointerUp = useCallback(() => {
    isThumbDragging.current = false;
  }, []);

  const todayRecord = useMemo(() => {
    if (!visibleData.length) return null;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    return (
      visibleData.find((d) => d.date === todayStr || d.is_forecast === 1) ||
      null
    );
  }, [visibleData]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const formatKeyLabel = (key: string) => {
    switch (key) {
      case "sm_percentile":
        return "Soil Percentile (%)";
      case "w":
        return "Soil Volume (mm)";
      case "P_obs":
        return "Precipitation (mm)";
      case "PE":
        return "Potential Evap (mm)";
      case "E":
        return "Actual Evap (mm)";
      case "R":
        return "Runoff (mm)";
      case "G":
        return "Deep Drainage (mm)";
      default:
        return key;
    }
  };

  if (!location || !location.lat || !location.lng) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-center min-h-75">
        <p className="text-muted-foreground text-sm">
          Select a location to view soil moisture.
        </p>
      </div>
    );
  }

  const renderInnerContent = () => {
    if (isResolving || isLoading) {
      return (
        <div className="h-65 w-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border mt-2">
          <LoaderCircle className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">
            Analyzing soil hydrology...
          </span>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="h-65 w-full flex flex-col justify-center items-center text-center gap-2 bg-destructive/5 rounded-lg border border-dashed border-destructive/20 mt-2 p-4 animate-in fade-in duration-300">
          <CloudOff className="size-8 text-destructive/60 mb-1 animate-pulse" />
          <h4 className="text-destructive font-semibold text-sm">
            Analysis Failed
          </h4>
          <p className="text-xs text-muted-foreground max-w-64">
            Failed to retrieve soil moisture data. Please select another
            location or try again later.
          </p>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="h-65 w-full flex items-center justify-center text-muted-foreground text-xs mt-2 bg-muted/5 rounded-lg border border-dashed border-border">
          No soil moisture data available.
        </div>
      );
    }

    const needsScroll = totalPoints > VISIBLE_POINTS;

    return (
      <div className="w-full mt-2 flex flex-col">
        {/* Chart area with wheel scroll */}
        <div
          className="h-65 w-full"
          onWheel={handleWheel}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              key={isDark ? "dark" : "light"}
              data={visibleData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <YAxis hide={true} domain={[0, 100]} scale={"symlog"} />
              <CartesianGrid
                stroke={"var(--muted-foreground)"}
                strokeDasharray="3 3"
                vertical={true}
                horizontal={true}
                opacity={0.35}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                axisLine={false}
                tickLine={!isDark}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={10}
                minTickGap={50}
              />

              <Tooltip
                content={<CustomTooltip t={t} />}
                cursor={{
                  stroke: "var(--muted-foreground)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {todayRecord && (
                <ReferenceLine
                  x={todayRecord.date}
                  stroke={"var(--muted-foreground)"}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  className={isDark ? "stroke-white text-white" : ""}
                  style={{ stroke: "var(--muted-foreground)" }}
                />
              )}
              {Object.keys(charts)
                .filter((key) => charts[key as keyof typeof charts])
                .map((key) => {
                  const color = SERIES_COLORS[key] || "var(--foreground)";
                  return (
                    <Line
                      key={key}
                      type="linear"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={
                        key === "sm_percentile" ? "6 6" : undefined
                      }
                      dot={key === "sm_percentile" ? <CustomDot /> : false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      isAnimationActive={false}
                      className={isDark ? "stroke-white text-white" : ""}
                      style={{ stroke: color }}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scrollbar with arrow buttons */}
        {needsScroll && (
          <div className="flex items-center gap-1 mt-1.5 mb-1 mx-1">
            <button
              onClick={handleStepLeft}
              disabled={resolvedOffset <= 0}
              className="shrink-0 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Scroll chart left"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div
              ref={trackRef}
              className="relative flex-1 h-2.5 rounded-full bg-muted/50 cursor-pointer touch-none"
              onPointerDown={handleTrackPointerDown}
              onPointerMove={handleTrackPointerMove}
              onPointerUp={handleTrackPointerUp}
              onPointerCancel={handleTrackPointerUp}
            >
              <div
                className="absolute top-0.5 h-1.5 rounded-full bg-muted-foreground/60 transition-[left] duration-75 ease-out hover:bg-foreground/70 active:bg-foreground/80"
                style={{
                  width: `${thumbWidthPct}%`,
                  left: `${thumbLeftPct}%`,
                }}
              />
            </div>
            <button
              onClick={handleStepRight}
              disabled={resolvedOffset >= maxOffset}
              className="shrink-0 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Scroll chart right"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl p-5 pb-2 shadow-sm select-none flex flex-col">
      {/* SECTION SUBTITLE BAR */}
      <div className="flex items-center justify-between text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2 relative">
        <div className="flex items-center gap-2">
          <Droplets className="size-4.5" />
          {t.dashboard?.soilMoisture || "SOIL MOISTURE"}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"outline"}
              size={"icon"}
              className="h-7 w-7 rounded-md cursor-pointer hover:bg-muted"
            >
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 z-9999" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Chart Series Settings</DropdownMenuLabel>
              {Object.keys(charts).map((key) => {
                const Icon = SERIES_ICONS[key];
                return (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={charts[key as keyof typeof charts]}
                    onCheckedChange={(checked) =>
                      setCharts({ ...charts, [key]: checked })
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="flex items-center gap-2">
                      {Icon && (
                        <Icon className="size-4.5 text-muted-foreground shrink-0" />
                      )}
                      {formatKeyLabel(key)}
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {renderInnerContent()}
    </div>
  );
}
