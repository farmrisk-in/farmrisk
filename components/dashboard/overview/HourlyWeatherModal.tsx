"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock, X, ChevronDown } from "lucide-react";

interface HourlyWeatherModalProps {
  open: boolean;
  onClose: () => void;
  locationName?: string;
  hourly?: {
    time: (Date | string)[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    wind_gusts_10m?: number[];
    weather_code: number[];
    icon: string[];
    rain: number[];
    is_day?: number[];
    relative_humidity_2m?: number[];
    apparent_temperature?: number[];
    uv_index?: number[];
    cloud_cover?: number[];
    et0_fao_evapotranspiration?: number[];
  };
}

interface ParamConfig {
  name: string;
  unit: string;
  kind: "line" | "bar";
  color: string;
  dec: number;
  fixed?: [number, number];
  zero?: string;
  compare?: string;
}

const PARAMS: Record<string, ParamConfig> = {
  temp: { name: "Temperature", unit: "°C", kind: "line", color: "#D9480F", dec: 1 },
  pp: { name: "Rain chance", unit: "%", kind: "bar", color: "#2563EB", dec: 0, fixed: [0, 100], zero: "No rain expected in the next 24 hours" },
  pr: { name: "Rainfall", unit: "mm", kind: "bar", color: "#1E40AF", dec: 1, zero: "No rainfall expected in the next 24 hours" },
  ws: { name: "Wind speed", unit: "kph", kind: "line", color: "#0F766E", dec: 1 },
  at: { name: "Feels like", unit: "°C", kind: "line", color: "#C2410C", dec: 1, compare: "temp" },
  rh: { name: "Humidity", unit: "%", kind: "line", color: "#0E7490", dec: 0, fixed: [0, 100] },
  uv: { name: "UV index", unit: "", kind: "bar", color: "uv", dec: 1 },
  wg: { name: "Wind gusts", unit: "kph", kind: "line", color: "#1D4ED8", dec: 1, compare: "ws" },
  cc: { name: "Cloud cover", unit: "%", kind: "bar", color: "#64748B", dec: 0, fixed: [0, 100], zero: "Clear skies: 0% cloud cover all day" },
  et: { name: "Evapotranspiration (ET₀)", unit: "mm", kind: "bar", color: "#15803D", dec: 2 },
};

const EXTRAS = ["at", "rh", "uv", "wg", "cc", "et"];

function formatHourLabel(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const h = date.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")} ${ampm}`;
}

function fmt(v: number, d: number): string {
  return String(Number(v.toFixed(d)));
}

function withUnit(v: string, p: ParamConfig): string {
  const u = p.unit;
  if (!u) return v;
  return u === "%" || u === "°C" ? v + u : v + " " + u;
}

function uvCat(v: number) {
  const r = Math.round(v);
  if (r < 3) return { name: "Low", bg: "#DCFCE7", fg: "#166534", bar: "#22C55E" };
  if (r < 6) return { name: "Moderate", bg: "#FEF3C7", fg: "#854D0E", bar: "#EAB308" };
  if (r < 8) return { name: "High", bg: "#FFEDD5", fg: "#9A3412", bar: "#F97316" };
  if (r < 11) return { name: "Very high", bg: "#FEE2E2", fg: "#991B1B", bar: "#DC2626" };
  return { name: "Extreme", bg: "#F3E8FF", fg: "#6B21A8", bar: "#9333EA" };
}

function niceCeil(x: number): number {
  const m = Math.pow(10, Math.floor(Math.log10(Math.max(x, 0.001))));
  const f = [1, 2, 2.5, 5, 10];
  for (let k = 0; k < f.length; k++) {
    if (f[k] * m >= x) return f[k] * m;
  }
  return 10 * m;
}

export function HourlyWeatherModal({
  open,
  onClose,
  locationName,
  hourly,
}: HourlyWeatherModalProps) {
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState<string | null>("temp");
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Build the 24 hour datasets
  const data = useMemo(() => {
    if (!hourly || !hourly.time || hourly.time.length === 0) {
      return null;
    }

    const n = Math.min(24, hourly.time.length);
    const H: string[] = [];
    const isDayList: boolean[] = [];

    const temp: number[] = [];
    const pp: number[] = [];
    const pr: number[] = [];
    const ws: number[] = [];
    const at: number[] = [];
    const rh: number[] = [];
    const uv: number[] = [];
    const wg: number[] = [];
    const cc: number[] = [];
    const et: number[] = [];

    for (let i = 0; i < n; i++) {
      const rawDate = hourly.time[i];
      H.push(formatHourLabel(rawDate));
      
      const dateObj = new Date(rawDate);
      const hourVal = dateObj.getHours();
      const isDay = hourly.is_day && hourly.is_day[i] !== undefined
        ? Boolean(hourly.is_day[i])
        : hourVal >= 6 && hourVal < 19;
      isDayList.push(isDay);

      const t = hourly.temperature_2m[i] ?? 25;
      temp.push(t);
      pp.push(hourly.precipitation_probability[i] ?? 0);
      pr.push(hourly.rain[i] ?? 0);
      const windSpeed = hourly.wind_speed_10m[i] ?? 5;
      ws.push(windSpeed);

      // Apparent temp / feels like
      at.push(hourly.apparent_temperature?.[i] ?? t);
      // Relative humidity
      rh.push(hourly.relative_humidity_2m?.[i] ?? 55);
      // UV index
      uv.push(hourly.uv_index?.[i] ?? (isDay ? Math.max(0, Math.sin(((hourVal - 6) / 12) * Math.PI) * 6) : 0));
      // Wind gusts
      wg.push(hourly.wind_gusts_10m?.[i] ?? Math.round(windSpeed * 1.35));
      // Cloud cover
      cc.push(hourly.cloud_cover?.[i] ?? 10);
      // Evapotranspiration
      et.push(hourly.et0_fao_evapotranspiration?.[i] ?? (isDay ? 0.35 : 0.02));
    }

    const D: Record<string, number[]> = {
      temp,
      pp,
      pr,
      ws,
      at,
      rh,
      uv,
      wg,
      cc,
      et,
    };

    return { H, isDayList, D, n };
  }, [hourly]);

  if (!open) return null;

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-card text-foreground p-6 rounded-2xl border border-border shadow-xl max-w-md w-full text-center">
          <p className="text-sm text-muted-foreground mb-4">No hourly weather data available.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { H, isDayList, D, n } = data;

  const toggleParam = (key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  };

  // Build chart
  const buildChart = (key: string) => {
    const p = PARAMS[key];
    if (!p) return null;

    const v = D[key] || [];
    const cmp = p.compare ? D[p.compare] : null;
    const top = 30;
    const bot = 172;

    let lo: number, hi: number;
    const vmax = Math.max(...v, 0);
    const vmin = Math.min(...v, 0);

    if (p.fixed) {
      lo = p.fixed[0];
      hi = p.fixed[1];
    } else if (p.kind === "bar") {
      lo = 0;
      hi = vmax > 0 ? niceCeil(vmax * 1.1) : 1;
    } else {
      const all = cmp ? v.concat(cmp) : v;
      const mn = Math.min(...all);
      const mx = Math.max(...all);
      const pad = Math.max((mx - mn) * 0.12, 1);
      lo = Math.floor(mn - pad);
      hi = Math.ceil(mx + pad);
      hi = lo + Math.ceil((hi - lo) / 4) * 4;
    }

    if (hi === lo) hi = lo + 1;

    const Y = (val: number) => bot - ((val - lo) / (hi - lo)) * (bot - top);
    const X = (i: number) => 32 + 64 * i;

    const grid = [0, 1, 2, 3, 4].map((k) => {
      const val = lo + ((hi - lo) * k) / 4;
      return { y: Y(val), ly: Y(val) - 4, label: fmt(val, p.dec > 0 ? 1 : 0) };
    });

    const imax = v.indexOf(vmax);
    const imin = v.indexOf(vmin);
    const color = p.color === "uv" ? "#F97316" : p.color;

    let note = "";
    if (key === "at") {
      let best = 0;
      let bi = 0;
      v.forEach((val, i) => {
        const d = val - D.temp[i];
        if (d > best) {
          best = d;
          bi = i;
        }
      });
      if (best > 0) {
        note = `Feels up to ${fmt(best, 1)}°C warmer than air temperature (${H[bi]})`;
      } else {
        note = `Feels similar to air temperature`;
      }
    } else if (key === "uv") {
      const cat = uvCat(vmax);
      note = `Peak category: ${cat.name} (${fmt(vmax, 1)}) at ${H[imax]}`;
    } else if (key === "wg") {
      note = `Peak gust ${fmt(vmax, 0)} kph vs ${fmt(D.ws[imax], 0)} kph sustained wind`;
    }

    let line = "";
    let area = "";
    let cmpPath = "";
    const points: Array<{ cx: number; cy: number; r: number; fill: string; stroke: string }> = [];
    const bars: Array<{ x: number; y: number; h: number; fill: string }> = [];
    const labels: Array<{ x: number; y: number; text: string }> = [];
    let empty = "";

    if (p.kind === "line") {
      const pts = v.map((val, i) => `${X(i)} ${Y(val).toFixed(1)}`);
      line = "M" + pts.join(" L ");
      area = line + ` L ${X(n - 1)} ${bot} L ${X(0)} ${bot} Z`;

      if (cmp) {
        cmpPath = "M" + cmp.map((val, i) => `${X(i)} ${Y(val).toFixed(1)}`).join(" L ");
      }

      v.forEach((val, i) => {
        const isKeyPoint = i === imax || i === imin;
        points.push({
          cx: X(i),
          cy: Y(val),
          r: isKeyPoint ? 4.5 : 3,
          fill: isKeyPoint ? color : "#FFFFFF",
          stroke: color,
        });
      });

      labels.push({ x: X(imax), y: Y(vmax) - 11, text: fmt(vmax, p.dec) });
      if (imin !== imax) {
        labels.push({ x: X(imin), y: Y(vmin) + 20, text: fmt(vmin, p.dec) });
      }
    } else if (vmax > 0) {
      v.forEach((val, i) => {
        const fill = p.color === "uv" ? uvCat(val).bar : p.color;
        bars.push({
          x: X(i) - 16,
          y: Y(val),
          h: Math.max(bot - Y(val), 0),
          fill,
        });
      });
      labels.push({ x: X(imax), y: Y(vmax) - 7, text: fmt(vmax, p.dec) });
    } else {
      empty = p.zero || "No values above zero in the next 24 hours";
    }

    return {
      name: p.name,
      color,
      grid,
      line,
      area,
      cmpPath,
      points,
      bars,
      labels,
      empty,
      hasCompare: Boolean(cmp),
      compareName: cmp ? PARAMS[p.compare!].name : "",
      maxText: withUnit(fmt(vmax, p.dec), p) + " at " + H[imax],
      minText: withUnit(fmt(vmin, p.dec), p) + " at " + H[imin],
      note,
      hasNote: Boolean(note),
    };
  };

  const chart = selected ? buildChart(selected) : null;
  const cols = expanded ? "176px repeat(24, 64px)" : "repeat(24, 64px)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalCardRef}
        className="relative w-full max-w-[1240px] max-h-[95vh] overflow-y-auto bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl shadow-2xl p-4 sm:p-5 text-gray-900 dark:text-gray-100 flex flex-col box-border scrollbar-thin"
      >
        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-[15px] font-bold tracking-wide uppercase m-0">
              HOURLY WEATHER FORECAST (24 HOURS)
            </h2>
            {locationName && (
              <span className="text-xs text-muted-foreground font-normal ml-1">
                · {locationName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium tracking-wider bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
              NEXT 24 HOURS
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE TABLE AREA */}
        <div className="overflow-x-auto mt-2 pb-2 scrollbar-thin">
          <div className="min-w-max">
            {/* 1. Hours row */}
            <div
              className="grid items-stretch h-[34px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border" />
              )}
              {H.map((lbl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[13px] text-gray-600 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800"
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* 2. Sky row */}
            <div
              className="grid items-stretch h-[40px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-3 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                  Sky
                </div>
              )}
              {H.map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center border-l border-gray-100 dark:border-gray-800"
                >
                  {isDayList[i] ? (
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 28 28"
                      aria-label="Day"
                    >
                      <circle cx="14" cy="14" r="9" fill="#F5B400" />
                      <circle
                        cx="14"
                        cy="14"
                        r="9"
                        fill="none"
                        stroke="#E09A00"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 28 28"
                      aria-label="Night"
                    >
                      <path
                        d="M18.5 4.5a10 10 0 1 0 5 15.2A8 8 0 0 1 18.5 4.5z"
                        fill="#4C8DF6"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* 3. Temperature row */}
            <div
              className="grid items-stretch h-[38px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-1.5">
                  <button
                    type="button"
                    onClick={() => toggleParam("temp")}
                    className={`flex items-baseline gap-1.5 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all cursor-pointer ${
                      selected === "temp"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-200 dark:ring-blue-800"
                        : "text-gray-800 dark:text-gray-200 font-normal hover:bg-gray-50 dark:hover:bg-muted/40"
                    }`}
                  >
                    Temperature{" "}
                    <span className="text-[11px] opacity-75">°C</span>
                  </button>
                </div>
              )}
              {D.temp.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[17px] font-bold border-l border-gray-100 dark:border-gray-800"
                >
                  {Math.round(v)}
                </div>
              ))}
            </div>

            {/* 4. Rain chance row */}
            <div
              className="grid items-stretch h-[34px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-1.5">
                  <button
                    type="button"
                    onClick={() => toggleParam("pp")}
                    className={`flex items-baseline gap-1.5 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all cursor-pointer ${
                      selected === "pp"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-200 dark:ring-blue-800"
                        : "text-gray-800 dark:text-gray-200 font-normal hover:bg-gray-50 dark:hover:bg-muted/40"
                    }`}
                  >
                    Rain chance{" "}
                    <span className="text-[11px] opacity-75">%</span>
                  </button>
                </div>
              )}
              {D.pp.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[13px] text-blue-600 dark:text-blue-400 font-medium border-l border-gray-100 dark:border-gray-800"
                >
                  {v}%
                </div>
              ))}
            </div>

            {/* 5. Rainfall row */}
            <div
              className="grid items-stretch h-[34px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-1.5">
                  <button
                    type="button"
                    onClick={() => toggleParam("pr")}
                    className={`flex items-baseline gap-1.5 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all cursor-pointer ${
                      selected === "pr"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-200 dark:ring-blue-800"
                        : "text-gray-800 dark:text-gray-200 font-normal hover:bg-gray-50 dark:hover:bg-muted/40"
                    }`}
                  >
                    Rainfall{" "}
                    <span className="text-[11px] opacity-75">mm</span>
                  </button>
                </div>
              )}
              {D.pr.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[13px] text-gray-600 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800"
                >
                  {fmt(v, 1)}mm
                </div>
              ))}
            </div>

            {/* 6. Wind speed row */}
            <div
              className="grid items-stretch h-[34px]"
              style={{ gridTemplateColumns: cols }}
            >
              {expanded && (
                <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-1.5">
                  <button
                    type="button"
                    onClick={() => toggleParam("ws")}
                    className={`flex items-baseline gap-1.5 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all cursor-pointer ${
                      selected === "ws"
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-200 dark:ring-blue-800"
                        : "text-gray-800 dark:text-gray-200 font-normal hover:bg-gray-50 dark:hover:bg-muted/40"
                    }`}
                  >
                    Wind speed{" "}
                    <span className="text-[11px] opacity-75">kph</span>
                  </button>
                </div>
              )}
              {D.ws.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-[13px] text-gray-600 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800"
                >
                  {Math.round(v)}kph
                </div>
              ))}
            </div>

            {/* EXPANDABLE PARAMETERS */}
            {expanded && (
              <>
                {EXTRAS.map((k) => {
                  const p = PARAMS[k];
                  const vals = D[k];
                  return (
                    <div
                      key={k}
                      className="grid items-stretch h-[40px] border-b border-gray-100 dark:border-gray-800"
                      style={{ gridTemplateColumns: "176px repeat(24, 64px)" }}
                    >
                      <div className="sticky left-0 z-10 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex items-center px-1.5">
                        <button
                          type="button"
                          onClick={() => toggleParam(k)}
                          className={`flex items-baseline gap-1.5 w-full min-h-[32px] px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-all cursor-pointer ${
                            selected === k
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold shadow-xs ring-1 ring-blue-200 dark:ring-blue-800"
                              : "text-gray-800 dark:text-gray-200 font-normal hover:bg-gray-50 dark:hover:bg-muted/40"
                          }`}
                        >
                          {k === "et" ? "ET₀" : p.name}{" "}
                          <span className="text-[11px] opacity-75">
                            {p.unit || "index"}
                          </span>
                        </button>
                      </div>
                      {vals.map((v, i) => {
                        let cellContent: React.ReactNode = null;
                        if (k === "at") {
                          cellContent = (
                            <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100">
                              {Math.round(v)}°C
                            </span>
                          );
                        } else if (k === "rh" || k === "cc") {
                          cellContent = (
                            <span className="text-[13px] text-gray-600 dark:text-gray-400">
                              {Math.round(v)}%
                            </span>
                          );
                        } else if (k === "wg") {
                          cellContent = (
                            <span className="text-[13px] text-gray-600 dark:text-gray-400">
                              {Math.round(v)}kph
                            </span>
                          );
                        } else if (k === "et") {
                          cellContent = (
                            <span className="text-[13px] text-gray-600 dark:text-gray-400">
                              {v.toFixed(2)}
                            </span>
                          );
                        } else if (k === "uv") {
                          const cat = uvCat(v);
                          cellContent = (
                            <span
                              style={{ backgroundColor: cat.bg, color: cat.fg }}
                              className="inline-block min-w-[26px] text-center px-2 py-0.5 rounded-full text-[12px] font-semibold"
                            >
                              {fmt(v, 1)}
                            </span>
                          );
                        }

                        return (
                          <div
                            key={i}
                            className="flex items-center justify-center border-l border-gray-100 dark:border-gray-800"
                          >
                            {cellContent}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}

            {/* CHART DISPLAY AREA */}
            {expanded && chart && (
              <div
                className="grid items-stretch border-t border-gray-200 dark:border-border bg-gray-50/70 dark:bg-muted/20 mt-2"
                style={{ gridTemplateColumns: "176px 1536px" }}
              >
                {/* Left Sidebar */}
                <div className="sticky left-0 z-10 bg-gray-50 dark:bg-card border-r border-gray-200 dark:border-border p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="text-[14px] font-bold leading-tight">
                      {chart.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="size-7 rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-muted flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer shrink-0"
                      aria-label="Close chart"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Max
                      </span>{" "}
                      {chart.maxText}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Min
                      </span>{" "}
                      {chart.minText}
                    </div>
                  </div>

                  {chart.hasNote && (
                    <div className="text-[12px] leading-snug text-gray-800 dark:text-gray-200 bg-white dark:bg-muted border border-gray-200 dark:border-border rounded-lg p-2">
                      {chart.note}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block"
                        style={{
                          width: "16px",
                          borderTop: `3px solid ${chart.color}`,
                        }}
                      />
                      <span>{chart.name}</span>
                    </div>
                    {chart.hasCompare && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-4"
                          style={{
                            borderTop: "2px dashed #9CA3AF",
                          }}
                        />
                        <span>{chart.compareName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right SVG Chart */}
                <div className="overflow-hidden">
                  <svg
                    width="1536"
                    height="214"
                    viewBox="0 0 1536 214"
                    className="block font-sans select-none"
                  >
                    {/* Night shading bands: hours where !isDayList */}
                    {isDayList.map((isDay, i) =>
                      !isDay ? (
                        <rect
                          key={i}
                          x={i * 64}
                          y="22"
                          width="64"
                          height="150"
                          className="fill-gray-200/60 dark:fill-gray-800/40"
                        />
                      ) : null
                    )}

                    {/* 5 Horizontal grid lines */}
                    {chart.grid.map((g, idx) => (
                      <g key={idx}>
                        <line
                          x1="0"
                          x2="1536"
                          y1={g.y}
                          y2={g.y}
                          className="stroke-gray-200 dark:stroke-gray-800"
                          strokeWidth="1"
                        />
                        <text
                          x="8"
                          y={g.ly}
                          fontSize="10"
                          className="fill-gray-500 dark:fill-gray-400 font-medium"
                          style={{
                            paintOrder: "stroke",
                            stroke: "var(--background, #FFFFFF)",
                            strokeWidth: "3px",
                          }}
                        >
                          {g.label}
                        </text>
                      </g>
                    ))}

                    {/* Area fill for line charts */}
                    {chart.area && (
                      <path
                        d={chart.area}
                        fill={chart.color}
                        fillOpacity="0.10"
                      />
                    )}

                    {/* Compare dashed line */}
                    {chart.hasCompare && chart.cmpPath && (
                      <path
                        d={chart.cmpPath}
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                    )}

                    {/* Main line */}
                    {chart.line && (
                      <path
                        d={chart.line}
                        fill="none"
                        stroke={chart.color}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Bar charts */}
                    {chart.bars.map((b, idx) => (
                      <rect
                        key={idx}
                        x={b.x}
                        y={b.y}
                        width="32"
                        height={b.h}
                        rx="4"
                        fill={b.fill}
                      />
                    ))}

                    {/* Circle points on line */}
                    {chart.points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.cx}
                        cy={p.cy}
                        r={p.r}
                        fill={p.fill}
                        stroke={p.stroke}
                        strokeWidth="2"
                      />
                    ))}

                    {/* Max & Min peak labels */}
                    {chart.labels.map((l, idx) => (
                      <text
                        key={idx}
                        x={l.x}
                        y={l.y}
                        fontSize="12"
                        fontWeight="700"
                        className="fill-gray-900 dark:fill-gray-100"
                        textAnchor="middle"
                        style={{
                          paintOrder: "stroke",
                          stroke: "var(--background, #FCFCFD)",
                          strokeWidth: "4px",
                        }}
                      >
                        {l.text}
                      </text>
                    ))}

                    {/* Centered empty notice if all zeros */}
                    {chart.empty && (
                      <text
                        x="768"
                        y="104"
                        fontSize="14"
                        fontWeight="500"
                        className="fill-gray-500 dark:fill-gray-400"
                        textAnchor="middle"
                      >
                        {chart.empty}
                      </text>
                    )}

                    {/* Bottom hour labels */}
                    {H.map((lbl, idx) => (
                      <text
                        key={idx}
                        x={32 + 64 * idx}
                        y="196"
                        fontSize="11"
                        className="fill-gray-500 dark:fill-gray-400 font-medium"
                        textAnchor="middle"
                      >
                        {lbl}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM TOGGLE BUTTON & FOOTER */}
        <div className="flex flex-col items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-border shrink-0">
          <button
            type="button"
            onClick={() => {
              setExpanded((prev) => {
                const next = !prev;
                if (next && !selected) setSelected("temp");
                return next;
              });
            }}
            className="flex items-center justify-center gap-2 px-5 py-2 min-h-[38px] border border-gray-300 dark:border-border rounded-full bg-white dark:bg-muted text-gray-900 dark:text-gray-100 font-medium text-[13px] hover:bg-gray-50 dark:hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
          >
            <span>{expanded ? "Show less" : "More parameters & charts"}</span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {expanded
              ? "Tap any parameter name to plot it · shaded bands = night hours"
              : "Expand to see more parameters and charts"}
          </span>
        </div>
      </div>
    </div>
  );
}
