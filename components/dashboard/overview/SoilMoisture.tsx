/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from "recharts";

import { useLocationContext } from "@/providers/LocationProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { useSoilMoisture } from "@/hooks/useSoilMoisture";
import { usePro } from "@/hooks/usePro";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
const getCategoryAndColor = (pct: number, t?: TranslationType) => {
  if (pct > 98)
    return {
      label: t?.dashboard?.smExceptionalWet || "Exceptional Wet",
      color: "#0284c7",
    };
  if (pct > 95)
    return {
      label: t?.dashboard?.smExtremeWet || "Extreme Wet",
      color: "#0ea5e9",
    };
  if (pct > 90)
    return {
      label: t?.dashboard?.smSevereWet || "Severe Wet",
      color: "#38bdf8",
    };
  if (pct > 80)
    return {
      label: t?.dashboard?.smModerateWet || "Moderate Wet",
      color: "#7dd3fc",
    };
  if (pct > 70)
    return {
      label: t?.dashboard?.smAbnormallyWet || "Abnormally Wet",
      color: "#bae6fd",
    };
  if (pct > 30)
    return {
      label: t?.dashboard?.smNormal || "Normal",
      color: "#64748b",
    };
  if (pct > 20)
    return {
      label: t?.dashboard?.smAbnormallyDry || "Abnormally Dry",
      color: "#fed7aa",
    };
  if (pct > 10)
    return {
      label: t?.dashboard?.smModerateDry || "Moderate Dry",
      color: "#fdba74",
    };
  if (pct > 5)
    return {
      label: t?.dashboard?.smExtremeDry || "Extreme Dry",
      color: "#f97316",
    };
  if (pct > 2)
    return {
      label: t?.dashboard?.smSevereDry || "Severe Dry",
      color: "#ea580c",
    };
  return {
    label: t?.dashboard?.smExceptionalDry || "Exceptional Dry",
    color: "#9a3412",
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

    const smValue = data.sm_percentile;
    const hasSm = typeof smValue === "number";
    const { label: category, color: categoryColor } = hasSm
      ? getCategoryAndColor(smValue, t)
      : { label: "", color: "" };

    return (
      <div className="bg-popover border border-border rounded-md px-3.5 py-2.5 shadow-md min-w-44 space-y-2 text-xs text-popover-foreground">
        <div className="flex items-center justify-between font-bold border-b border-border pb-1.5 gap-3">
          <span className="text-muted-foreground">{dateStr}</span>
          {category && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs shrink-0"
              style={{
                color: categoryColor,
                backgroundColor: `${categoryColor}20`,
                border: `1px solid ${categoryColor}50`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              {category}
            </span>
          )}
        </div>
        {payload.map((entry) => {
          const key = entry.dataKey as string;
          const value = entry.value as number;
          const color = entry.stroke || "currentColor";

          let name = key;
          let formattedValue =
            typeof value === "number" ? value.toFixed(1) : value;

          if (key === "sm_percentile") {
            name = "Soil Percentile";
            formattedValue = `${value.toFixed(1)}%`;
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
  P_obs: CloudRain,
  PE: Wind,
  E: Sun,
  R: Waves,
  G: Download,
};

export default function SoilMoisture() {
  const { location, isResolving } = useLocationContext();
  const { t, language } = useLanguage();
  const { isPro } = usePro();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Dialog State for Irrigation Calendar Selector
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [daysbefore, setDaysbefore] = useState<number | undefined>(() => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem("irrigation_days_before");
      return val ? parseInt(val, 10) : undefined;
    }
    return undefined;
  });

  useEffect(() => {
    const handleIrrigationUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDaysbefore(detail);
    };

    window.addEventListener(
      "farmrisk-irrigation-updated",
      handleIrrigationUpdate,
    );
    return () => {
      window.removeEventListener(
        "farmrisk-irrigation-updated",
        handleIrrigationUpdate,
      );
    };
  }, []);

  const handleSubmitQuestions = async () => {
    if (!selectedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    const daysBack = diffDays + 15; // Offset by the 15 forecast days (16-day forecast including today)

    if (typeof window !== "undefined") {
      sessionStorage.setItem("irrigation_days_before", String(daysBack));
      sessionStorage.setItem("irrigation_questions_answered", "true");
    }
    setDaysbefore(daysBack);
    window.dispatchEvent(
      new CustomEvent("farmrisk-irrigation-updated", { detail: daysBack }),
    );
    setIsDialogOpen(false);
  };

  const handleSkipQuestions = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("irrigation_days_before");
      sessionStorage.removeItem("irrigation_questions_answered");
    }
    setDaysbefore(undefined);
    setSelectedDate(null);
    window.dispatchEvent(
      new CustomEvent("farmrisk-irrigation-updated", { detail: undefined }),
    );
    setIsDialogOpen(false);
  };

  const [charts, setCharts] = useState({
    P_obs: false,
    PE: false,
    E: false,
    R: false,
    G: false,
    sm_percentile: true,
  });
  const [isDark] = useState(false);

  const {
    data: report,
    isLoading,
    isError,
  } = useSoilMoisture(isPro ? daysbefore : undefined);
  const soilMoistureData = report?.soil_moisture || [];

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

  // --- SCROLLBAR THUMB DRAG ---
  const trackRef = useRef<HTMLDivElement>(null);
  const isThumbDragging = useRef(false);

  const thumbWidthPct =
    totalPoints > 0 ? Math.min(100, (VISIBLE_POINTS / totalPoints) * 100) : 100;
  const thumbLeftPct =
    maxOffset > 0 ? (resolvedOffset / maxOffset) * (100 - thumbWidthPct) : 0;

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

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (totalPoints <= VISIBLE_POINTS || !trackRef.current) return;
      isThumbDragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = trackRef.current.getBoundingClientRect();
      const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
      const newOffset = Math.round(
        (clickPct / (100 - thumbWidthPct)) * maxOffset,
      );
      setScrollOffset(Math.min(maxOffset, Math.max(0, newOffset)));
    },
    [totalPoints, maxOffset, thumbWidthPct],
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isThumbDragging.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
      const newOffset = Math.round(
        (clickPct / (100 - thumbWidthPct)) * maxOffset,
      );
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

  const isDateDisabled = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 50);
    minDate.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    return d > today || d < minDate;
  }, []);

  const today = new Date();

  const getSelectedDateSummary = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const tObj = new Date(today);
    tObj.setHours(0, 0, 0, 0);
    const diffTime = tObj.getTime() - d.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (language === "hi") {
      if (diffDays === 0) return "आज (आज ही सिंचाई की)";
      if (diffDays === 1) return "कल (1 दिन पहले)";
      return `${diffDays} दिन पहले (${d.toLocaleDateString("hi-IN", { month: "short", day: "numeric" })})`;
    }
    if (language === "mr") {
      if (diffDays === 0) return "आज (आजच पाणी दिले)";
      if (diffDays === 1) return "काल (1 दिवस पूर्वी)";
      return `${diffDays} दिवसांपूर्वी (${d.toLocaleDateString("mr-IN", { month: "short", day: "numeric" })})`;
    }
    if (language === "ta") {
      if (diffDays === 0) return "இன்று";
      if (diffDays === 1) return "நேற்று";
      return `${diffDays} நாட்களுக்கு முன்பு (${d.toLocaleDateString("ta-IN", { month: "short", day: "numeric" })})`;
    }
    if (language === "gu") {
      if (diffDays === 0) return "આજે";
      if (diffDays === 1) return "ગઇકાલે";
      return `${diffDays} દિવસ પહેલા (${d.toLocaleDateString("gu-IN", { month: "short", day: "numeric" })})`;
    }

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
  };

  const questionText = (() => {
    if (language === "hi") return "पिछली सिंचाई कब की थी?";
    if (language === "mr") return "शेवटचे पाणी कधी दिले?";
    if (language === "ta") return "கடைசியாக எப்போது நீர் பாய்ச்சினீர்கள்?";
    if (language === "gu") return "છેલ્લે ક્યારે સિંચાઈ કરી?";
    return "When did you last irrigate?";
  })();

  const defaultMonth = isMobile
    ? today
    : new Date(today.getFullYear(), today.getMonth() - 1, 1);

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
      <div className="w-full flex flex-col select-none touch-pan-y">
        <div className="w-full h-65 mt-2" onWheel={handleWheel}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={visibleData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <YAxis domain={[0, 100]} allowDataOverflow={false} hide={true} />
              <ReferenceArea
                y1={70}
                y2={100}
                fill="var(--color-sky-500)"
                fillOpacity={0.06}
              />
              <ReferenceArea
                y1={0}
                y2={30}
                fill="var(--color-orange-500)"
                fillOpacity={0.06}
              />
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
                  if (key === "P_obs") {
                    return (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={color}
                        isAnimationActive={false}
                        style={{ fill: color }}
                        barSize={8}
                        radius={[2, 2, 0, 0]}
                      />
                    );
                  }
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
            </ComposedChart>
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
          <Droplets className="size-4.5 text-blue-500" />
          {t.dashboard?.soilMoisture || "SOIL MOISTURE"}
        </div>
        <div className="flex items-center gap-2">
          {/* IRRIGATION DATE DIALOG BUTTON */}
          {isPro && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 text-xs px-2.5 rounded-md flex items-center gap-1.5 border-border transition-all cursor-pointer font-medium ${
                    daysbefore !== undefined
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <CalendarIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {language === "hi"
                      ? "सिंचाई तारीख"
                      : language === "mr"
                        ? "सिंचन तारीख"
                        : language === "ta"
                          ? "நீர் பாசனம்"
                          : language === "gu"
                            ? "સિંચાઈ તારીખ"
                            : "Irrigation Date"}
                  </span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-2xl border border-border p-5 rounded-2xl gap-4">
                <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <DialogTitle className="text-sm font-bold text-foreground">
                      {questionText}
                    </DialogTitle>
                    {selectedDate && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {getSelectedDateSummary(selectedDate)}
                      </span>
                    )}
                  </div>
                </DialogHeader>

                {/* DUAL MONTH CALENDAR ON DESKTOP / SINGLE MONTH ON MOBILE */}
                <div className="w-full flex justify-center items-center py-2 overflow-x-auto">
                  <ShadcnCalendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date) => setSelectedDate(date || null)}
                    numberOfMonths={isMobile ? 1 : 2}
                    defaultMonth={defaultMonth}
                    disabled={isDateDisabled}
                    className="p-1 bg-transparent border-0 shadow-none"
                  />
                </div>

                {/* DIALOG ACTIONS */}
                <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                  <button
                    type="button"
                    onClick={handleSkipQuestions}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                  >
                    {daysbefore !== undefined ? "Clear / Reset Filter" : "Skip"}
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitQuestions}
                    disabled={!selectedDate}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Submit & Forecast
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* SETTINGS MENU */}
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
      </div>

      {renderInnerContent()}
    </div>
  );
}
