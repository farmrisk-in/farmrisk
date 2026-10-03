import os

content = """\"\"\"use client\"\"\";

import React, { useState, useEffect, useMemo } from "react";
import { Store, IndianRupee, Scale, AlertTriangle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ToolCard } from "@/components/dashboard/tools/ToolCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelectedCrop } from "@/hooks/useSelectedCrop";
import { useLocationContext } from "@/providers/LocationProvider";
import { useMandiData, MandiRow } from "@/hooks/useMandiData";

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chattisgarh",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Meghalaya", "NCT of Delhi", "Nagaland", "Odisha", "Pondicherry",
  "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

function rupee(n: number | null | undefined) {
  if (n === null || n === undefined || !isFinite(n)) return "₹—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function median(a: number[]) {
  const s = a.filter(v => isFinite(v)).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function human(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysOld(iso: string) {
  const then = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((now - then) / 86400000);
}

function getResolvedData(rows: MandiRow[], dist: string, crop: string, day: string) {
  let relaxed: any = null;
  const byCrop = rows.filter(r => !crop || r.c === crop);
  const byBoth = byCrop.filter(r => !dist || r.d === dist);

  const hit = byBoth.filter(r => r.t === day);
  if (hit.length) return { view: hit, relaxed, resolvedDay: day };

  const days = Array.from(new Set(byBoth.map(r => r.t))).sort();
  if (days.length) {
    const last = days[days.length - 1];
    relaxed = { kind: "day", from: day, to: last };
    return { view: byBoth.filter(r => r.t === last), relaxed, resolvedDay: last };
  }

  if (dist) {
    const wideDays = Array.from(new Set(byCrop.map(r => r.t))).sort();
    if (wideDays.length) {
      const d2 = wideDays[wideDays.length - 1];
      relaxed = { kind: "district", from: dist, to: d2 };
      return { view: byCrop.filter(r => r.t === d2), relaxed, resolvedDay: d2 };
    }
  }

  return { view: [], relaxed: null, resolvedDay: day };
}

function RangeChart({ list }: { list: MandiRow[] }) {
  const top = [...list].sort((a, b) => (b.p || 0) - (a.p || 0)).slice(0, 12);
  if (top.length < 2) return null;
  const lo = Math.min(...top.map(r => r.a || r.p));
  let hi = Math.max(...top.map(r => r.b || r.p));
  if (!(hi > lo)) hi = lo + 1;

  const rowH = 30, padL = 170, padR = 80, w = 900;
  const h = top.length * rowH + 14;
  const x = (v: number) => padL + ((v - lo) / (hi - lo)) * (w - padL - padR);

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Where the crop is fetching most</h3>
      <div className="text-[13px] text-muted-foreground mb-3">Bar is the day's bid range in each market. Dot is the modal rate.</div>
      <div className="flex gap-4 text-xs text-muted-foreground mb-2 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-800"></span>Low to high bid</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>Modal rate</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto text-[12.5px]" role="img" aria-label="Price range by market">
        {top.map((r, i) => {
          const y = i * rowH + 12;
          const x1 = x(r.a ?? r.p);
          const x2 = x(r.b ?? r.p);
          const xm = x(r.p ?? r.a);
          const label = (r.m || "").length > 23 ? r.m.slice(0, 22) + "…" : r.m;

          return (
            <g key={i}>
              <text x={padL - 12} y={y + 5} textAnchor="end" className="fill-muted-foreground">{label}</text>
              <rect x={x1} y={y - 4} width={Math.max(2, x2 - x1)} height="9" rx="4.5" className="fill-emerald-300 dark:fill-emerald-800" />
              <circle cx={xm} cy={y + 0.5} r="5.5" className="fill-emerald-600 dark:fill-emerald-400" />
              <text x={w - 10} y={y + 5} textAnchor="end" className="fill-foreground font-mono">{rupee(r.p)}</text>
              <title>{`${r.m} — min ${rupee(r.a)}, modal ${rupee(r.p)}, max ${rupee(r.b)}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TrendChart({ rows, crop, dist, relaxed }: { rows: MandiRow[], crop: string, dist: string, relaxed: any }) {
  if (!crop) return null;
  const pool = rows.filter(r => r.c === crop && (!dist || relaxed ? true : r.d === dist));
  const days = Array.from(new Set(pool.map(r => r.t))).sort();
  if (days.length < 3) return null;

  const pts = days.map(d => {
    const dayRows = pool.filter(r => r.t === d).map(r => r.p);
    return { t: d, v: median(dayRows) };
  }).filter(p => p.v !== null) as {t: string, v: number}[];

  if (pts.length < 3) return null;

  const vals = pts.map(p => p.v);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const span = hi - lo || 1;
  lo -= span * 0.15;
  hi += span * 0.15;

  const w = 900, h = 190, padL = 68, padR = 14, padT = 12, padB = 30;
  const X = (i: number) => padL + (i / (pts.length - 1)) * (w - padL - padR);
  const Y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);

  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L ${X(pts.length - 1).toFixed(1)} ${h - padB} L ${X(0).toFixed(1)} ${h - padB} Z`;

  const grid = [hi, (hi + lo) / 2, lo].map((v, i) => (
    <g key={i}>
      <line x1={padL} x2={w - padR} y1={Y(v).toFixed(1)} y2={Y(v).toFixed(1)} className="stroke-border" />
      <text x={padL - 10} y={Y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11.5px]">{rupee(v)}</text>
    </g>
  ));

  const labels = [0, pts.length - 1].map(i => (
    <text key={i} x={X(i).toFixed(1)} y={h - 10} textAnchor={i ? "end" : "start"} className="fill-muted-foreground text-[11.5px]">
      {human(pts[i].t)}
    </text>
  ));

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">{crop} over the last {pts.length} reporting days</h3>
      <div className="text-[13px] text-muted-foreground mb-3">Median modal rate, built from the rolling snapshot.</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto text-xs" role="img" aria-label="Price trend">
        {grid}
        <path d={area} className="fill-emerald-500/10 dark:fill-emerald-900/20" />
        <path d={line} fill="none" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={X(i).toFixed(1)} cy={Y(p.v).toFixed(1)} r="3" className="fill-emerald-600 dark:fill-emerald-400">
            <title>{human(p.t)} — {rupee(p.v)}</title>
          </circle>
        ))}
        {labels}
      </svg>
    </div>
  );
}

export function MandiPrice() {
  const { t } = useLanguage();
  const { selectedCrop } = useSelectedCrop();
  const { location } = useLocationContext();

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");

  const [sort, setSort] = useState<{key: keyof MandiRow, dir: number}>({ key: "p", dir: -1 });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // 1. Resolve State
  useEffect(() => {
    if (!selectedState && location) {
      const s = STATES.find(st => (location.displayName || "").includes(st) || (location.name || "").includes(st));
      if (s) setSelectedState(s);
    }
  }, [location, selectedState]);

  // 2. Fetch Data
  const { data: rows, loading: isLoading, error } = useMandiData(selectedState);

  // 3. Derive filter options
  const districts = useMemo(() => Array.from(new Set(rows.map(r => r.d))).sort(), [rows]);
  const commodities = useMemo(() => Array.from(new Set(rows.map(r => r.c))).sort(), [rows]);
  const days = useMemo(() => Array.from(new Set(rows.map(r => r.t))).sort().reverse(), [rows]);

  // Auto-select latest day if not set
  useEffect(() => {
    if (days.length > 0 && (!selectedDay || !days.includes(selectedDay))) {
      setSelectedDay(days[0]);
    }
  }, [days, selectedDay]);

  // Reset pagination on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedDistrict, selectedCommodity, selectedDay, sort]);

  // 4. Resolve data view
  const { view, relaxed, resolvedDay } = useMemo(() => {
    return getResolvedData(rows, selectedDistrict, selectedCommodity, selectedDay);
  }, [rows, selectedDistrict, selectedCommodity, selectedDay]);

  const title = t.tools?.mandiPrice || "Mandi Price";
  const desc = t.tools?.mandiPriceDesc || "Wholesale APMC market arrivals and modal trading rates for the selected crop.";

  // CSV download
  const downloadCSV = () => {
    if (!view.length) return;
    const head = ["District", "Market", "Commodity", "Variety", "Arrival_Date", "Min_Price", "Max_Price", "Modal_Price"];
    const lines = [head.join(",")].concat(
      view.map(r => [r.d, r.m, r.c, r.v, r.t, r.a, r.b, r.p]
        .map(v => '"' + String(v === null ? "" : v).replace(/\"/g, '""') + '"').join(",")
      )
    );
    const blob = new Blob([lines.join("\\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mandi-${selectedState}-${view[0].t}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Sort view
  const sortedView = useMemo(() => {
    return [...view].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (['a','b','p'].includes(sort.key)) {
        return (((y as number) || 0) - ((x as number) || 0)) * (sort.dir === 1 ? -1 : 1);
      }
      return String(x).localeCompare(String(y)) * (sort.dir === 1 ? 1 : -1);
    });
  }, [view, sort]);

  // Pagination view
  const paginatedView = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedView.slice(start, start + rowsPerPage);
  }, [sortedView, currentPage]);
  const totalPages = Math.ceil(sortedView.length / rowsPerPage);

  const bestRow = sortedView.reduce((a, b) => (b.p || 0) > (a.p || 0) ? b : a, sortedView[0]);

  // Handle sort click
  const handleSort = (k: keyof MandiRow) => {
    if (sort.key === k) setSort({ key: k, dir: -sort.dir });
    else setSort({ key: k, dir: -1 });
  };

  // Stats calc
  const modal = median(view.map(r => r.p));
  const mins = view.map(r => r.a).filter(isFinite);
  const maxs = view.map(r => r.b).filter(isFinite);
  const minVal = mins.length ? Math.min(...mins) : null;
  const maxVal = maxs.length ? Math.max(...maxs) : null;
  const loRow = view.find(r => r.a === minVal);
  const hiRow = view.find(r => r.b === maxVal);
  const mktCount = new Set(view.map(r => r.m)).size;
  const cCount = new Set(view.map(r => r.c)).size;

  let deltaStr = "";
  let isUp = true;
  if (selectedCommodity && modal) {
    const pool = rows.filter(r => r.c === selectedCommodity && (!selectedDistrict || relaxed ? true : r.d === selectedDistrict));
    const dDays = Array.from(new Set(pool.map(r => r.t))).sort();
    const idx = dDays.indexOf(resolvedDay);
    if (idx > 0) {
      const prev = median(pool.filter(r => r.t === dDays[idx - 1]).map(r => r.p));
      if (prev) {
        const pc = ((modal - prev) / prev) * 100;
        if (Math.abs(pc) >= 0.5) {
          isUp = pc > 0;
          deltaStr = `${isUp ? '▲' : '▼'}${Math.abs(pc).toFixed(1)}%`;
        }
      }
    }
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedDistrict("");
    setSelectedCommodity("");
    setSelectedDay("");
  };

  return (
    <ToolCard
      title={title}
      description={desc}
      icon={Store}
      badge={
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {selectedCommodity || selectedCrop.name || "Mandi"}
        </span>
      }
      action={
        <button
          onClick={downloadCSV}
          disabled={!view.length}
          className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 disabled:opacity-50 flex items-center gap-1"
        >
          <Download className="size-3" /> CSV
        </button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">State</label>
            <select
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-50"
              value={selectedState}
              onChange={handleStateChange}
            >
              <option value="">Select State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">District</label>
            <select
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-50"
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              disabled={!selectedState || isLoading}
            >
              <option value="">All districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Commodity</label>
            <select
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-50"
              value={selectedCommodity}
              onChange={e => setSelectedCommodity(e.target.value)}
              disabled={!selectedState || isLoading}
            >
              <option value="">All commodities</option>
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Reporting day</label>
            <select
              className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-50"
              value={resolvedDay || selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              disabled={!selectedState || isLoading}
            >
              {days.map(d => <option key={d} value={d}>{human(d)}</option>)}
            </select>
          </div>
        </div>

        {/* Notices */}
        {relaxed && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[13px] text-amber-800 dark:text-amber-200">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <div>
              {relaxed.kind === "day" ? (
                <><b>No returns filed for {human(relaxed.from)}.</b> Showing {human(relaxed.to)}, the most recent day these markets reported.</>
              ) : (
                <><b>{relaxed.from} filed nothing in this window.</b> Showing the nearest reporting markets across {selectedState} for {human(relaxed.to)}.</>
              )}
            </div>
          </div>
        )}

        {!selectedState ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-sm font-medium text-muted-foreground mb-1">Select a State</p>
            <p className="text-xs text-muted-foreground/70">Please select a state to view APMC mandi prices.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !view.length ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground">
            <p className="font-semibold text-sm mb-1 text-foreground">No market filed this crop in the stored window</p>
            <p className="text-[13px]">Kharif crops only appear once harvest arrivals start. Widen the district or pick another crop.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-1">
                <span className="text-[11.5px] font-medium text-muted-foreground">Modal price</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                  {rupee(modal)}
                  {deltaStr && (
                    <span className={`text-xs ml-2 font-medium ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {deltaStr}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Median of {view.length} listings</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11.5px] font-medium text-muted-foreground">Lowest bid</span>
                <span className="text-xl font-bold text-foreground">{rupee(minVal)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 truncate" title={loRow?.m || "Per quintal"}>{loRow?.m || "Per quintal"}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11.5px] font-medium text-muted-foreground">Highest bid</span>
                <span className="text-xl font-bold text-foreground">{rupee(maxVal)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 truncate" title={hiRow?.m || "Per quintal"}>{hiRow?.m || "Per quintal"}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col gap-1">
                <span className="text-[11.5px] font-medium text-muted-foreground">Markets reporting</span>
                <span className="text-xl font-bold text-foreground">{mktCount}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{cCount} commodities listed</span>
              </div>
            </div>

            <TrendChart rows={rows} crop={selectedCommodity} dist={selectedDistrict} relaxed={relaxed} />
            <RangeChart list={view} />

            {/* Table */}
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Every market that filed</h3>
              <div className="text-[13px] text-muted-foreground mb-3">Highest modal rate is highlighted. Click a heading to sort.</div>
              
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left border-collapse text-[13.5px] whitespace-nowrap min-w-[720px]">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                      {[
                        {k: 'm', l: 'Market'}, {k: 'd', l: 'District'}, {k: 'c', l: 'Commodity'},
                        {k: 'v', l: 'Variety'}, {k: 'a', l: 'Min ₹'}, {k: 'b', l: 'Max ₹'}, {k: 'p', l: 'Modal ₹'}
                      ].map(col => (
                        <th 
                          key={col.k} 
                          className={`p-2.5 font-medium cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none ${['a','b','p'].includes(col.k) ? 'text-right' : ''}`}
                          onClick={() => handleSort(col.k as keyof MandiRow)}
                        >
                          {col.l}
                          {sort.key === col.k && (sort.dir === 1 ? " ↑" : " ↓")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedView.map((r, i) => (
                      <tr key={i} className={`border-b border-border last:border-0 ${r === bestRow ? 'bg-emerald-500/10' : ''}`}>
                        <td className="p-2.5">{r.m || "—"}</td>
                        <td className="p-2.5">{r.d || "—"}</td>
                        <td className="p-2.5">{r.c || "—"}</td>
                        <td className="p-2.5">{r.v || "—"}</td>
                        <td className="p-2.5 text-right font-mono">{rupee(r.a)}</td>
                        <td className="p-2.5 text-right font-mono">{rupee(r.b)}</td>
                        <td className="p-2.5 text-right font-mono">{rupee(r.p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                  <div>Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedView.length)} of {sortedView.length} entries</div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="px-2">{currentPage} / {totalPages}</span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolCard>
  );
}

export default MandiPrice;
