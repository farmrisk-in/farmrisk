"use client";

import React, { useState, useEffect } from "react";
import { type CropOption } from "./Overview";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { calculateTimelineSegments } from "@/lib/utils";
import { useCalendar } from "@/hooks/useCalendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CropCalenderProps {
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

const CropCalender = ({ selectedCrop }: CropCalenderProps) => {
  const { data, error } = useCalendar(selectedCrop.id);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  useEffect(() => {
    const handleBodyClick = () => setActiveTooltipId(null);
    document.body.addEventListener("click", handleBodyClick);
    return () => document.body.removeEventListener("click", handleBodyClick);
  }, []);

  if (error || !data || !data.calendar || data.calendar.length === 0) {
    return null;
  }

  // Find current month index (1-12) and day calculation for the "Today" marker pin position
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1; // 1 to 12
  const currentDayNum = today.getDate();
  const totalDaysInMonth = new Date(
    today.getFullYear(),
    currentMonthNum,
    0,
  ).getDate();

  // Percent positioning helper for absolute marker placement across the grid layout width
  const todayPercentPosition =
    (currentMonthNum - 1 + currentDayNum / totalDaysInMonth) * (100 / 12);

  return (
    <div className="w-full bg-card border border-border rounded-xl p-5 shadow-sm select-none transition-all">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-b border-border mb-2 pb-2">
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase tracking-wider">
          <Calendar className="size-4.5" />
          <span>Crop Calendar</span>
          <Badge variant={"default"} className="text-[10px] ml-auto rounded-[7px]">
            {data.calendar[0]?.crop || selectedCrop.name}
          </Badge>
        </div>

        <div className="flex items-center text-[10px] text-muted-foreground">
          <Badge
            variant={"outline"}
            className="text-[10px] rounded-none gap-2 rounded-l-[7px]"
          >
            <div className="w-3 h-2 bg-emerald-500 rounded-xs" />
            Sowing
          </Badge>
          <Badge
            variant={"outline"}
            className="text-[10px] rounded-none gap-2"
          >
            <div className="w-3 h-2 bg-amber-500/30 rounded-xs border border-amber-500/20" />
            Growing
          </Badge>
          <Badge
            variant={"outline"}
            className="text-[10px] rounded-none rounded-r-[7px] gap-2"
          >
            <div className="w-3 h-2 bg-rose-500 rounded-xs" />
            Harvesting
          </Badge>
        </div>
      </div>

      {data.calendar.map((event, idx) => {
        const startSow = event.sowFromMon || 6;
        const endSow = event.sowToMon || startSow;
        const startHarv = event.harvFromMon || 11;
        const endHarv = event.harvToMon || startHarv;

        // Resolve segment matrices using the tracking calculation helper
        const sowingSegments = calculateTimelineSegments(startSow, endSow);
        const harvestingSegments = calculateTimelineSegments(
          startHarv,
          endHarv,
        );

        // Growing period bridges the gap from initial Sowing start to final Harvest finish
        const growingSegments = calculateTimelineSegments(startSow, endHarv);

        const startSowLabel = MONTHS_LABELS[startSow - 1];
        const endHarvLabel = MONTHS_LABELS[endHarv - 1];

        return (
          <div key={idx} className="mb-6 last:mb-0 select-none">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-foreground/90">
                {event.season || "Kharif"} Season
              </span>
            </div>

            <div className="relative w-full h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-border/40">
              {/* MONTHS GRID LAYOUT BACKPLANE */}
              <div className="absolute inset-0 grid grid-cols-12 w-full h-full pointer-events-none">
                {MONTHS_LABELS.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="flex items-center justify-center border-r border-border/10 last:border-r-0 text-[10px] font-medium text-muted-foreground/40"
                  >
                    {m}
                  </div>
                ))}
              </div>

              {/* A. GROWING SEASON BLOCKS (YELLOW GRADIENT BACKGROUNDS) */}
              {growingSegments.map(
                (seg, sIdx) =>
                  seg.isVisible && (
                    <Tooltip
                      key={`grow-${sIdx}`}
                      open={activeTooltipId === `${idx}-grow`}
                      onOpenChange={(open) =>
                        open
                          ? setActiveTooltipId(`${idx}-grow`)
                          : setActiveTooltipId(null)
                      }
                    >
                      <TooltipTrigger asChild>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltipId(
                              activeTooltipId === `${idx}-grow`
                                ? null
                                : `${idx}-grow`,
                            );
                          }}
                          className="absolute h-3/5 translate-y-[33%] bg-amber-500/20 dark:bg-amber-400/10 border-x border-amber-500/10 hover:bg-amber-500/30 transition-all duration-200 cursor-pointer z-0"
                          style={{
                            left: `${seg.left}%`,
                            width: `${seg.width}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-xs p-2 rounded-md shadow-md">
                        <p className="font-semibold text-amber-600 dark:text-amber-400">
                          Growing Window
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          Est. Duration: {startSowLabel} to {endHarvLabel}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ),
              )}

              {/* B. SOWING BLOCKS (GREEN ACTION TILES) */}
              {sowingSegments.map(
                (seg, sIdx) =>
                  seg.isVisible && (
                    <Tooltip
                      key={`sow-${sIdx}`}
                      open={activeTooltipId === `${idx}-sow`}
                      onOpenChange={(open) =>
                        open
                          ? setActiveTooltipId(`${idx}-sow`)
                          : setActiveTooltipId(null)
                      }
                    >
                      <TooltipTrigger asChild>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltipId(
                              activeTooltipId === `${idx}-sow`
                                ? null
                                : `${idx}-sow`,
                            );
                          }}
                          className="absolute h-full bg-emerald-600 dark:bg-emerald-500 rounded-sm rounded-r-none transition-all duration-200 hover:scale-y-110 hover:brightness-110 cursor-pointer z-10"
                          style={{
                            left: `${seg.left}%`,
                            width: `${seg.width}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-xs p-2 rounded-md shadow-md">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Sowing Window
                        </p>
                        <p className="text-muted-foreground text-[11px] font-medium">
                          {event.sowingPeriod || "Active Phase"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ),
              )}

              {/* C. HARVESTING BLOCKS (RED ACTION TILES) */}
              {harvestingSegments.map(
                (seg, sIdx) =>
                  seg.isVisible && (
                    <Tooltip
                      key={`harv-${sIdx}`}
                      open={activeTooltipId === `${idx}-harv`}
                      onOpenChange={(open) =>
                        open
                          ? setActiveTooltipId(`${idx}-harv`)
                          : setActiveTooltipId(null)
                      }
                    >
                      <TooltipTrigger asChild>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltipId(
                              activeTooltipId === `${idx}-harv`
                                ? null
                                : `${idx}-harv`,
                            );
                          }}
                          className="absolute h-full bg-rose-600 dark:bg-rose-500 rounded-l-none rounded-sm transition-all duration-200 hover:scale-y-110 hover:brightness-110 cursor-pointer z-10"
                          style={{
                            left: `${seg.left}%`,
                            width: `${seg.width}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border text-xs p-2 rounded-md shadow-md">
                        <p className="font-semibold text-rose-600 dark:text-rose-400">
                          Harvest Window
                        </p>
                        <p className="text-muted-foreground text-[11px] font-medium">
                          {event.harvestingPeriod || "Active Phase"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ),
              )}

              {/* D. TODAY PIN LAYOUT SECTOR */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute -top-1 -bottom-1 w-1 bg-zinc-900 dark:bg-zinc-100 z-20 shadow-md cursor-ew-resize transition-all duration-200 hover:w-1.5"
                    style={{ left: `${todayPercentPosition}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-zinc-950 text-zinc-50 border border-zinc-800 font-mono text-[11px] p-2 rounded-sm shadow-lg"
                >
                  <span>
                    Today:{" "}
                    {new Date().toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CropCalender;
