"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { t, language } = useLanguage();
  const { isPro } = usePro();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState(() => new Date());
  const [questionsAnswered, setQuestionsAnswered] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("irrigation_questions_answered") === "true";
    }
    return false;
  });
  const [daysbefore, setDaysbefore] = useState<number | undefined>(() => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem("irrigation_days_before");
      return val ? parseInt(val, 10) : undefined;
    }
    return undefined;
  });

  const handleSubmitQuestions = async () => {
    if (!selectedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    const payload = {
      selectedDate: selectedDate.toISOString().split("T")[0],
      daysBack: diffDays,
      timestamp: new Date().toISOString(),
    };

    console.log("Submitting irrigation answers to backend:", payload);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("irrigation_days_before", String(diffDays));
      sessionStorage.setItem("irrigation_questions_answered", "true");
    }
    setDaysbefore(diffDays);
    setQuestionsAnswered(true);
  };

  const handleSkipQuestions = () => {
    console.log("User skipped irrigation questions.");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("irrigation_days_before");
      sessionStorage.setItem("irrigation_questions_answered", "true");
    }
    setDaysbefore(undefined);
    setQuestionsAnswered(true);
  };

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

  const { data: report, isLoading, isError } = useSoilMoisture(daysbefore);
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

  const thumbWidthPct =
    totalPoints > 0 ? Math.min(100, (VISIBLE_POINTS / totalPoints) * 100) : 100;
  const thumbLeftPct =
    maxOffset > 0 ? (resolvedOffset / maxOffset) * (100 - thumbWidthPct) : 0;

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
    // If the user is Pro and has not answered/skipped the questions, show the questions UI
    if (isPro && !questionsAnswered) {
      const viewYear = currentViewDate.getFullYear();
      const viewMonth = currentViewDate.getMonth();

      // First day of the viewed month (0 = Sunday, 1 = Monday, etc.)
      const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

      // Total days in viewed month
      const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      const cells = [];

      // Padding cells
      for (let i = 0; i < firstDayIndex; i++) {
        cells.push({ isPadding: true, key: `pad-${i}` });
      }

      // Days of the month
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const minDate = new Date(today);
      minDate.setDate(today.getDate() - 30);

      const maxDate = new Date(today);

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateObj = new Date(viewYear, viewMonth, day);
        const dateCompare = new Date(dateObj);
        dateCompare.setHours(0, 0, 0, 0);

        const isClickable = dateCompare >= minDate && dateCompare <= maxDate;
        const isSelected = selectedDate
          ? selectedDate.getFullYear() === viewYear &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getDate() === day
          : false;

        const isToday =
          today.getFullYear() === viewYear &&
          today.getMonth() === viewMonth &&
          today.getDate() === day;

        cells.push({
          isPadding: false,
          day,
          date: dateObj,
          isClickable,
          isSelected,
          isToday,
          key: `day-${day}`,
        });
      }

      const handlePrevMonth = () => {
        const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
        const limitDate = new Date(today);
        limitDate.setDate(today.getDate() - 30);
        const endOfPrevMonth = new Date(viewYear, viewMonth, 0);
        if (limitDate <= endOfPrevMonth) {
          setCurrentViewDate(prevMonthDate);
        }
      };

      const handleNextMonth = () => {
        const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
        if (
          nextMonthDate <= today ||
          (nextMonthDate.getFullYear() === today.getFullYear() &&
            nextMonthDate.getMonth() === today.getMonth())
        ) {
          setCurrentViewDate(nextMonthDate);
        }
      };

      const getSelectedDateSummary = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - d.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

        if (language === "hi") {
          if (diffDays === 0) return "आज (आज ही सिंचाई की)";
          if (diffDays === 1) return "कल (1 दिन पहले सिंचाई की)";
          return `${diffDays} दिन पहले सिंचाई की (${d.toLocaleDateString("hi-IN", { month: "short", day: "numeric" })})`;
        }
        if (language === "mr") {
          if (diffDays === 0) return "आज (आजच पाणी दिले)";
          if (diffDays === 1) return "काल (1 दिवस पूर्वी पाणी दिले)";
          return `${diffDays} दिवसांपूर्वी पाणी दिले (${d.toLocaleDateString("mr-IN", { month: "short", day: "numeric" })})`;
        }
        if (language === "ta") {
          if (diffDays === 0) return "இன்று (இன்றே நீர் பாய்ச்சப்பட்டது)";
          if (diffDays === 1)
            return "நேற்று (1 நாள் முன்பு நீர் பாய்ச்சப்பட்டது)";
          return `${diffDays} நாட்களுக்கு முன்பு நீர் பாய்ச்சப்பட்டது (${d.toLocaleDateString("ta-IN", { month: "short", day: "numeric" })})`;
        }
        if (language === "gu") {
          if (diffDays === 0) return "આજે (આજે જ પાણી આપ્યું)";
          if (diffDays === 1) return "ગઇકાલે (1 દિવસ પહેલા પાણી આપ્યું)";
          return `${diffDays} દિવસ પહેલા પાણી આપ્યું (${d.toLocaleDateString("gu-IN", { month: "short", day: "numeric" })})`;
        }

        if (diffDays === 0) return "Today (Irrigated today)";
        if (diffDays === 1) return "Yesterday (1 day ago)";
        return `Irrigated ${diffDays} days ago (${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
      };

      const questionText = (() => {
        if (language === "hi") return "आपने पिछली बार सिंचाई कब की थी?";
        if (language === "mr") return "तुम्ही शेवटचे पाणी कधी दिले होते?";
        if (language === "ta")
          return "நீங்கள் கடைசியாக எப்போது நீர் பாய்ச்சினீர்கள்?";
        if (language === "gu") return "તમે છેલ્લે ક્યારે સિંચાઈ કરી હતી?";
        return "When did you last irrigate?";
      })();

      const isPrevDisabled = (() => {
        const limitDate = new Date(today);
        limitDate.setDate(today.getDate() - 30);
        const endOfPrevMonth = new Date(viewYear, viewMonth, 0);
        return limitDate > endOfPrevMonth;
      })();

      const isNextDisabled =
        viewYear === today.getFullYear() && viewMonth === today.getMonth();

      const monthTitle = currentViewDate.toLocaleDateString(
        language === "hi" ? "hi-IN" : "en-US",
        {
          month: "long",
          year: "numeric",
        },
      );

      return (
        <div className="w-full mt-3 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-full max-w-md mx-auto flex flex-col space-y-4 p-4 bg-muted/20 border border-border rounded-xl">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {questionText}
            </h4>

            <div className="flex flex-col space-y-3 bg-card border border-border rounded-xl p-4 shadow-sm">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={isPrevDisabled}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-bold text-foreground">
                  {monthTitle}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isNextDisabled}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                {language === "hi"
                  ? ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"].map(
                      (day) => <div key={day}>{day}</div>,
                    )
                  : language === "mr"
                    ? ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनी"].map(
                        (day) => <div key={day}>{day}</div>,
                      )
                    : language === "ta"
                      ? ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"].map((day) => (
                          <div key={day}>{day}</div>
                        ))
                      : language === "gu"
                        ? [
                            "રવિ",
                            "સોમ",
                            "મંગળ",
                            "બુધ",
                            "ગુરુ",
                            "શુક્ર",
                            "શનિ",
                          ].map((day) => <div key={day}>{day}</div>)
                        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (day) => <div key={day}>{day}</div>,
                          )}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {cells.map((cell) => {
                  if (cell.isPadding) {
                    return <div key={cell.key} />;
                  }

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={!cell.isClickable}
                      onClick={() =>
                        cell.isClickable && setSelectedDate(cell.date)
                      }
                      className={`h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer relative ${
                        cell.isSelected
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30 scale-105"
                          : cell.isClickable
                            ? cell.isToday
                              ? "border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 hover:bg-muted"
                              : "bg-background hover:bg-muted text-foreground"
                            : "text-muted-foreground/30 bg-muted/5 cursor-not-allowed"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-extrabold animate-in fade-in zoom-in duration-200">
                <Calendar className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>{getSelectedDateSummary(selectedDate)}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
            <button
              type="button"
              onClick={handleSkipQuestions}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer"
            >
              Skip for now
            </button>
            <Button
              type="button"
              onClick={handleSubmitQuestions}
              disabled={!selectedDate}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit & Forecast
            </Button>
          </div>
        </div>
      );
    }

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
        <div className="h-65 w-full" onWheel={handleWheel}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={isDark ? "dark" : "light"}
              data={visibleData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <YAxis
                hide={false}
                domain={[0, 100]}
                scale="linear"
                axisLine={false}
                tickLine={!isDark}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={30}
              />
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
            {isPro && questionsAnswered && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      setQuestionsAnswered(false);
                      if (typeof window !== "undefined") {
                        sessionStorage.removeItem(
                          "irrigation_questions_answered",
                        );
                      }
                    }}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600 focus:bg-emerald-100/50 dark:focus:bg-emerald-500/10 cursor-pointer"
                  >
                    <Calendar className="size-4 text-emerald-500" />
                    <span>
                      {language === "hi"
                        ? "सिंचाई की तारीख अपडेट करें"
                        : language === "mr"
                          ? "पाणी दिल्याची तारीख बदला"
                          : language === "ta"
                            ? "நீர் பாய்ச்சிய தேதியை மாற்றுக"
                            : language === "gu"
                              ? "સિંચાઈ તારીખ અપડેટ કરો"
                              : "Update Irrigation Date"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {renderInnerContent()}
    </div>
  );
}
