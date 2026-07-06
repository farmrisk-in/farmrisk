"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  MapPin,
  Leaf,
  Bot,
  TrendingUpDown,
  Droplets,
} from "lucide-react";
import { type SelectedLocation } from "@/providers/LocationProvider";
import { type CropOption } from "./Overview";
import { useForecast } from "@/hooks/useForecast";
import { useWeather } from "@/hooks/useWeather";
import { useCalendar } from "@/hooks/useCalendar";
import { useAI } from "@/hooks/useAI";
import { calculateTimelineSegments } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DownloadTemplateProps {
  location: SelectedLocation;
  language: string;
  selectedCrop: CropOption;
}

const MONTHS_LABELS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

// A4 canvas + shared layout constants (fixed px, no responsive behavior)
const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_PAD = 32; // p-8
const CONTENT_W = PAGE_W - PAGE_PAD * 2; // 730

// Helper to determine the right weather icon based on rain volume thresholds
const getWeatherIcon = (pcp: number) => {
  if (pcp > 5.0) return "heavy_rain.svg";
  if (pcp > 1.0) return "showers_rain.svg";
  if (pcp > 0.1) return "drizzle.svg";
  return "cloud.svg";
};

// Maps strictly to the "Expert View" table, utilizing hex/standard values
const getCategoryAndColor = (pct: number) => {
  if (pct > 98) return { label: "Exceptional Wet", color: "#0284c7" };
  if (pct > 95) return { label: "Extreme Wet", color: "#0ea5e9" };
  if (pct > 90) return { label: "Severe Wet", color: "#7dd3fc" };
  if (pct > 80) return { label: "Moderate Wet", color: "#bae6fd" };
  if (pct > 70) return { label: "Abnormally Wet", color: "#e0f2fe" };
  if (pct > 30) return { label: "Normal", color: "#64748b" };
  if (pct > 20) return { label: "Abnormally Dry", color: "#fed7aa" };
  if (pct > 10) return { label: "Moderate Dry", color: "#fdba74" };
  if (pct > 5) return { label: "Extreme Dry", color: "#f97316" };
  if (pct > 2) return { label: "Severe Dry", color: "#ea580c" };
  return { label: "Exceptional Dry", color: "#9a3412" };
};

export default function DownloadTemplate({
  location,
  language,
  selectedCrop,
}: DownloadTemplateProps) {
  const [mounted, setMounted] = useState(false);

  const { data: forecastReport } = useForecast();
  const { data: weatherReport } = useWeather();
  const { data: calendarReport } = useCalendar(selectedCrop.id);
  const { data: aiOverviewText } = useAI(selectedCrop.id, language);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const soilMoistureData = forecastReport?.soil_moisture?.soil_moisture || [];
    if (soilMoistureData.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return soilMoistureData.filter((d) => {
      const dDate = new Date(d.date);
      return dDate >= thirtyDaysAgo;
    });
  }, [forecastReport]);

  // Computed once here (not after the early return below) so hook order
  // stays identical across the "not mounted yet" render and every render after.
  const daily = weatherReport?.daily;
  const fallbackPredictions = daily
    ? daily.time.map((time, idx) => ({
        date: new Date(time).toISOString().split("T")[0],
        tmax_corrected: daily.temperature_2m_max[idx],
        tmin_corrected: daily.temperature_2m_min[idx],
        pcp_corrected: daily.precipitation_sum[idx],
      }))
    : [];

  const finalForecast =
    forecastReport?.forecast?.forecast &&
    forecastReport.forecast.forecast.length > 0
      ? forecastReport.forecast.forecast
      : fallbackPredictions;

  const forecastDays = finalForecast.slice(0, 16);

  // Overall min/max across the visible window, used to scale each day's range bar
  const tempBounds = useMemo(() => {
    if (forecastDays.length === 0) return { min: 0, max: 1 };
    const mins = forecastDays.map((d) => d.tmin_corrected);
    const maxs = forecastDays.map((d) => d.tmax_corrected);
    const min = Math.min(...mins);
    const max = Math.max(...maxs);
    return { min, max: max === min ? min + 1 : max };
  }, [forecastDays]);

  if (!mounted) {
    return (
      <div
        style={{ width: PAGE_W, height: PAGE_H }}
        className="bg-white text-slate-800 p-8 flex flex-col justify-center items-center font-sans"
      >
        <p className="text-[13px] font-semibold text-emerald-700">
          Loading report template context...
        </p>
      </div>
    );
  }

  const dateStr = new Date().toLocaleDateString(
    language === "hi" ? "hi-IN" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  );
  const timeStr = new Date().toLocaleTimeString(
    language === "hi" ? "hi-IN" : "en-US",
    { hour: "2-digit", minute: "2-digit" },
  );

  const advisoryText =
    aiOverviewText || "Agricultural RAG overview generated successfully.";
  const formattedText = advisoryText
    .split(/(\*[^*]+\*)/g)
    .map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <strong key={index} className="text-emerald-800 font-bold">
            {part.slice(1, -1)}
          </strong>
        );
      }
      return part;
    });

  // ---------- Soil moisture chart ----------
  const renderSoilChart = () => {
    if (chartData.length === 0) {
      return (
        <div
          style={{ width: CONTENT_W }}
          className="h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] italic"
        >
          No hydrology data compiled for this coordinates range.
        </div>
      );
    }

    const svgWidth = CONTENT_W - 24; // minus chart card padding
    const svgHeight = 110;
    const padL = 25;
    const padR = 25;
    const padT = 15;
    const padB = 20;

    const chartW = svgWidth - padL - padR;
    const chartH = svgHeight - padT - padB;

    const points = chartData.map((d, idx) => {
      const x = padL + (idx / (chartData.length - 1)) * chartW;
      const y = padT + ((100 - d.sm_percentile) / 100) * chartH;
      return { x, y, val: d.sm_percentile, date: d.date };
    });

    const pathD =
      points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` +
          points
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(" ")
        : "";

    const yMax = padT;
    const yMid = padT + chartH / 2;
    const yMin = padT + chartH;

    const todayIndex = chartData.findIndex((d) => {
      const todayStr = new Date().toISOString().split("T")[0];
      return d.date === todayStr || d.is_forecast === 1;
    });
    const todayX =
      todayIndex !== -1
        ? padL + (todayIndex / (chartData.length - 1)) * chartW
        : null;

    const tickInterval = Math.max(1, Math.floor(chartData.length / 5));
    const xTicks = [];
    for (let i = 0; i < chartData.length; i += tickInterval) {
      xTicks.push(points[i]);
    }
    if (xTicks[xTicks.length - 1].date !== points[points.length - 1].date) {
      xTicks.push(points[points.length - 1]);
    }

    return (
      <div
        style={{ width: CONTENT_W }}
        className="bg-white border border-slate-300 rounded-lg p-3"
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="overflow-visible"
        >
          <line
            x1={padL}
            y1={yMax}
            x2={svgWidth - padR}
            y2={yMax}
            stroke="#94a3b8"
            strokeDasharray="3 3"
          />
          <line
            x1={padL}
            y1={yMid}
            x2={svgWidth - padR}
            y2={yMid}
            stroke="#94a3b8"
            strokeDasharray="3 3"
          />
          <line
            x1={padL}
            y1={yMin}
            x2={svgWidth - padR}
            y2={yMin}
            stroke="#94a3b8"
            strokeDasharray="3 3"
          />

          {todayX !== null && (
            <line
              x1={todayX}
              y1={padT}
              x2={todayX}
              y2={padT + chartH}
              stroke="#334155"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          <path d={pathD} fill="none" stroke="#047857" strokeWidth={2} />

          {points.map((p, idx) => {
            const { color } = getCategoryAndColor(p.val);
            return (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={color}
                stroke="#1e293b"
                strokeWidth={1}
              />
            );
          })}

          {xTicks.map((t, idx) => {
            const label = new Date(t.date).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            });
            return (
              <text
                key={idx}
                x={t.x}
                y={svgHeight - 4}
                textAnchor="middle"
                className="text-[8px] fill-slate-600 font-bold"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Legend so the dot colors are actually decodable */}
        <div className="flex items-center gap-3.5 mt-2 pt-2 border-t border-slate-300">
          {[
            { label: "Dry", color: "#f97316" },
            { label: "Normal", color: "#64748b" },
            { label: "Wet", color: "#0ea5e9" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.25">
              <span
                style={{ backgroundColor: l.color }}
                className="w-2 h-2 rounded-full inline-block border border-slate-700"
              />
              <span className="text-[8.5px] font-bold text-slate-700 uppercase tracking-wide">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------- Forecast strip (one compact column per day) ----------
  const BAR_TRACK_H = 46; // px, height of the vertical temperature bar

  const renderForecastList = () => {
    if (forecastDays.length === 0) {
      return (
        <div
          style={{ width: CONTENT_W }}
          className="h-15 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] italic"
        >
          No forecast data available for this location.
        </div>
      );
    }

    const { min, max } = tempBounds;
    const span = max - min;

    return (
      <div
        style={{ width: CONTENT_W }}
        className="border border-slate-300 rounded-lg bg-white p-2.5"
      >
        <div
          style={{ gridTemplateColumns: `repeat(${forecastDays.length}, 1fr)` }}
          className="grid"
        >
          {forecastDays.map((day, idx) => {
            const maxTemp = Math.round(day.tmax_corrected);
            const minTemp = Math.round(day.tmin_corrected);
            const rain = day.pcp_corrected;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dayNum = date.getDate();
            const monthShort = date.toLocaleDateString("en-US", {
              month: "short",
            });

            // Vertical range bar: top of track = overall hottest, bottom = overall coldest.
            // The filled segment marks where this day's own min-max sits within that scale.
            const fillPct = Math.max(
              ((day.tmax_corrected - day.tmin_corrected) / span) * 100,
              30,
            );
            const fillH = (BAR_TRACK_H * fillPct) / 100;
            const topPct = ((max - day.tmax_corrected) / span) * 100;
            const topOffset = Math.min(
              (BAR_TRACK_H * topPct) / 100,
              BAR_TRACK_H - fillH,
            );

            return (
              <div
                key={day.date}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 border-r border-slate-100 last:border-r-0",
                  idx === 0 && "bg-emerald-50 rounded-l-md",
                )}
              >
                <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wide">
                  {monthShort} {dayNum}
                </span>
                <span className="text-[9.5px] font-extrabold text-slate-800 leading-none">
                  {dayName}
                </span>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={"/weatherIcons/" + getWeatherIcon(rain)}
                  className="w-3.75 h-3.75 my-0.5"
                  alt=""
                />

                <span className="text-[11px] font-extrabold text-rose-600 tabular-nums leading-none">
                  {maxTemp}°
                </span>

                <span
                  className="relative block w-1.5 rounded-full my-0.5"
                  style={{
                    height: BAR_TRACK_H,
                    background:
                      "linear-gradient(180deg, #f97316 0%, #a3e635 50%, #0ea5e9 100%)",
                    opacity: 0.25,
                  }}
                >
                  <span
                    className="absolute left-0 w-1.5 rounded-full border border-white"
                    style={{
                      top: topOffset,
                      height: fillH,
                      background:
                        "linear-gradient(180deg, #f97316 0%, #0ea5e9 100%)",
                    }}
                  />
                </span>

                <span className="text-[10px] font-bold text-sky-700 tabular-nums leading-none">
                  {minTemp}°
                </span>

                <span
                  className={cn(
                    "text-[8px] font-mono tabular-nums leading-none",
                    rain > 0.1 ? "text-sky-700 font-bold" : "text-slate-400",
                  )}
                >
                  {rain > 0.1 ? rain.toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------- Crop calendar ----------
  const renderCalendarGrid = () => {
    const calendar = calendarReport?.calendar || [];
    if (calendar.length === 0) {
      return (
        <div
          style={{ width: CONTENT_W }}
          className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] italic"
        >
          No crop cycle calendar configured.
        </div>
      );
    }

    return (
      <div
        style={{ width: CONTENT_W }}
        className="bg-slate-50 border border-slate-300 rounded-lg p-3 flex flex-col gap-3"
      >
        {calendar.map((event, idx) => {
          const startSow = event.sowFromMon || 6;
          const endSow = event.sowToMon || startSow;
          const startHarv = event.harvFromMon || 11;
          const endHarv = event.harvToMon || startHarv;

          const sowingSegments = calculateTimelineSegments(startSow, endSow);
          const harvestingSegments = calculateTimelineSegments(
            startHarv,
            endHarv,
          );
          const growingSegments = calculateTimelineSegments(startSow, endHarv);

          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline text-[8.5px] font-extrabold text-slate-600 uppercase tracking-wide">
                <span>{event.season} Season Lifecycle</span>
                <span className="font-semibold text-slate-600 normal-case tracking-normal">
                  Sow: Mon {startSow}–{endSow} &nbsp;•&nbsp; Harvest: Mon{" "}
                  {startHarv}–{endHarv}
                </span>
              </div>
              <div className="relative w-full h-4.5 bg-slate-200/60 rounded-sm border border-slate-300/50 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-12 w-full h-full pointer-events-none">
                  {MONTHS_LABELS.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="border-r border-slate-300/40 last:border-r-0 flex items-center justify-center text-[8px] text-slate-500 font-extrabold"
                    >
                      {m}
                    </div>
                  ))}
                </div>
                {growingSegments.map(
                  (seg, sIdx) =>
                    seg.isVisible && (
                      <div
                        key={`grow-${sIdx}`}
                        className="absolute h-full bg-amber-400/20 border-x border-amber-500/25 z-0"
                        style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                      />
                    ),
                )}
                {sowingSegments.map(
                  (seg, sIdx) =>
                    seg.isVisible && (
                      <div
                        key={`sow-${sIdx}`}
                        className="absolute h-full bg-emerald-600 z-10"
                        style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                      />
                    ),
                )}
                {harvestingSegments.map(
                  (seg, sIdx) =>
                    seg.isVisible && (
                      <div
                        key={`harv-${sIdx}`}
                        className="absolute h-full bg-rose-600 z-10"
                        style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
                      />
                    ),
                )}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3.5 pt-1 border-t border-slate-200">
          {[
            { label: "Sowing", color: "bg-emerald-600" },
            {
              label: "Growing",
              color: "bg-amber-400/40 border border-amber-500/40",
            },
            { label: "Harvest", color: "bg-rose-600" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.25">
              <span
                className={cn("w-2.25 h-2.25 rounded-sm inline-block", l.color)}
              />
              <span className="text-[8.5px] font-semibold text-slate-600 uppercase tracking-wide">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ width: PAGE_W, height: PAGE_H }}
      className="bg-white text-slate-800 p-8 flex flex-col justify-between font-sans border-t-10 border-emerald-700 box-border"
    >
      <div className="flex flex-col gap-4">
        {/* 1. HEADER */}
        <div className="flex justify-between items-start pb-3.5 border-b-2 border-emerald-700/30">
          <div className="flex flex-col gap-0.75">
            <div className="flex items-center gap-2">
              <Leaf size={20} className="text-emerald-700" />
              <h1 className="text-[22px] font-black tracking-tight text-emerald-800 leading-none">
                FARMRISK ADVISORY
              </h1>
            </div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              Climate Intelligence &amp; Risk Report
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.25">
            <span className="inline-block px-2.5 py-0.75 rounded-full bg-emerald-700 text-white text-[9px] font-extrabold uppercase tracking-wide">
              Official Diagnostic PDF
            </span>
            <p className="text-[8.5px] text-slate-600 font-semibold">
              Generated Locally &middot; Not for Regulatory Submission
            </p>
          </div>
        </div>

        {/* 2. REGION & RUNTIME METADATA */}
        <div
          style={{ width: CONTENT_W }}
          className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-300 p-3.5 rounded-lg"
        >
          <div className="flex flex-col gap-0.75">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
              <MapPin className="size-3 text-emerald-700" />
              <span>Target Location</span>
            </div>
            <p className="font-extrabold text-slate-800 text-[12px] pl-4.5 truncate">
              {location.displayName || location.name}
            </p>
            <p className="font-mono text-slate-600 text-[9.5px] pl-4.5">
              {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
            </p>
          </div>

          <div className="flex flex-col gap-0.75 border-l border-slate-300 pl-4">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
              <Calendar className="size-3 text-emerald-700" />
              <span>Compilation Timestamp</span>
            </div>
            <p className="font-bold text-slate-800 text-[11px] pl-4.5">
              {dateStr}
            </p>
            <p className="font-mono text-slate-600 text-[9.5px] pl-4.5">
              {timeStr} Local Time
            </p>
          </div>
        </div>

        {/* 3. AI ADVISORY OVERVIEW */}
        <div
          style={{ width: CONTENT_W }}
          className="bg-emerald-50 border border-emerald-300 rounded-lg p-3.5 flex flex-col gap-2 h-32"
        >
          <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-black uppercase tracking-wider border-b border-emerald-300 pb-1.5">
            <Bot className="size-3.5" />
            <span>AI Agronomist Advisory Overview</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] text-slate-700 leading-normal line-clamp-5">
              {formattedText}
            </p>
          </div>
        </div>

        {/* 4. 16-DAY FORECAST */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-300 pb-1.5">
            <TrendingUpDown className="size-3.5 text-emerald-700" />
            <span>16-Day Weather Forecast Timeline</span>
          </div>
          {renderForecastList()}
        </div>

        {/* 5. SOIL HYDROMETRY */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-300 pb-1.5">
            <Droplets className="size-3.5 text-emerald-700" />
            <span>Soil Hydrology &amp; Hydrometry (30-Day Trend)</span>
          </div>
          {renderSoilChart()}
        </div>

        {/* 6. CROP CALENDAR */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-300 pb-1.5">
            <Leaf className="size-3.5 text-emerald-700" />
            <span>Crop Seasonal Calendar Cycles</span>
          </div>
          {renderCalendarGrid()}
        </div>
      </div>

      {/* 7. FOOTER */}
      <div className="border-t border-slate-300 pt-2.5 flex justify-between items-center text-[8px] text-slate-600 font-bold uppercase tracking-widest">
        <span>© {new Date().getFullYear()} FarmRisk Corporation</span>
        <span>
          Data verified against satellite hydrology and bias corrections
        </span>
      </div>
    </div>
  );
}
