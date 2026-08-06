"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function riskColor(score: number): string {
  if (score >= 80) return "#e53e3e"; // Extreme — vivid red
  if (score >= 60) return "#dd6b20"; // High — orange
  if (score >= 40) return "#d69e2e"; // Moderate — amber
  if (score >= 20) return "#38a169"; // Low — green
  return "#718096"; // Minimal — muted grey
}

function bandLabel(score: number): string {
  if (score >= 80) return "Extreme";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "No Risk";
}

interface RiskChartProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  reasons?: string[];
  major_factor?: string;
}

export default function RiskChart({
  title,
  icon,
  score,
  reasons,
  major_factor,
}: RiskChartProps) {
  const [hovered, setHovered] = useState(false);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  // Place the tooltip relative to its gauge and keep it inside the viewport.
  // The tooltip is rendered through a portal (document.body), so it is never
  // clipped by the overflow container of the card or the page layout.
  const computePosition = useCallback(() => {
    const gauge = gaugeRef.current;
    const tooltip = tooltipRef.current;
    if (!gauge || !tooltip) return;

    const margin = 8;
    const gap = 6;
    const rect = gauge.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let side: "top" | "bottom" = "top";
    let top = rect.top - th - gap;
    if (top < margin) {
      side = "bottom";
      top = rect.bottom + gap;
    }
    top = Math.min(Math.max(top, margin), vh - th - margin);

    let left = rect.left + rect.width / 2 - tw / 2;
    left = Math.min(Math.max(left, margin), vw - tw - margin);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    const caret = caretRef.current;
    if (caret) {
      if (side === "bottom") {
        caret.style.top = "auto";
        caret.style.bottom = "100%";
        caret.style.marginTop = "0";
        caret.style.marginBottom = "-1px";
        caret.style.borderTopColor = "transparent";
        caret.style.borderBottomColor = "var(--border)";
      } else {
        caret.style.top = "100%";
        caret.style.bottom = "auto";
        caret.style.marginTop = "-1px";
        caret.style.marginBottom = "0";
        caret.style.borderBottomColor = "transparent";
        caret.style.borderTopColor = "var(--border)";
      }
    }
  }, []);

  // Position the tooltip right after it mounts and keep it in sync while the
  // user scrolls or resizes the viewport.
  const hasReasons = !!reasons && reasons.length > 0;
  useLayoutEffect(() => {
    if (!hovered || !hasReasons) return;
    computePosition();
    window.addEventListener("scroll", computePosition, true);
    window.addEventListener("resize", computePosition);
    return () => {
      window.removeEventListener("scroll", computePosition, true);
      window.removeEventListener("resize", computePosition);
    };
  }, [hovered, hasReasons, computePosition]);

  const clampedScore = Math.max(0, Math.min(100, score ?? 0));
  const color = riskColor(clampedScore);
  const band = bandLabel(clampedScore);
  const trackColor = `${color}20`; // 12% opacity tint

  // Math for 180° semi-circle SVG arc (from left 180° to right 0°)
  // cx = 50, cy = 50, r = 36
  const targetAngle = 180 + (clampedScore / 100) * 180;
  const rad = (targetAngle * Math.PI) / 180;
  const endX = (50 + 36 * Math.cos(rad)).toFixed(2);
  const endY = (50 + 36 * Math.sin(rad)).toFixed(2);

  return (
    <div
      ref={gaugeRef}
      className="relative flex flex-col items-center select-none w-full max-w-25 sm:max-w-27.5 mx-auto group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Gauge wrapper with fluid aspect ratio */}
      <div className="relative w-full aspect-100/56 flex items-end justify-center">
        <svg viewBox="0 0 100 56" className="w-full h-full overflow-visible">
          {/* Background Track Arc (180° semi-circle) */}
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            stroke={trackColor}
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          {clampedScore > 0 && (
            <path
              d={`M 14 50 A 36 36 0 0 1 ${endX} ${endY}`}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 3px ${color}66)`,
              }}
            />
          )}
        </svg>

        {/* Icon perfectly centered in the arch cavity */}
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {React.isValidElement(icon) &&
            React.cloneElement(
              icon as React.ReactElement<{
                className?: string;
                style?: React.CSSProperties;
              }>,
              {
                className:
                  "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                style: { color },
              },
            )}
        </div>
      </div>

      {/* Label and Band */}
      <div className="mt-1 flex flex-col items-center text-center min-w-0 w-full px-0.5">
        <span className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight truncate w-full">
          {title}
        </span>
        <span
          className="text-[9px] sm:text-[10px] font-bold tracking-wide mt-0.5 px-1.5 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {band}
        </span>
      </div>

      {/* Hover Tooltip */}
      {hovered &&
        reasons &&
        reasons.length > 0 &&
        createPortal(
          <div
            ref={tooltipRef}
            className="
              fixed z-9999 pointer-events-none
              bg-popover text-popover-foreground border border-border/80 rounded-xl shadow-2xl
              px-3 py-2.5 w-48 sm:w-56 animate-in fade-in-50 zoom-in-95 duration-150
            "
            style={{
              boxShadow: `0 10px 25px -5px ${color}30, 0 4px 6px -2px rgba(0, 0, 0, 0.05)`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-border/40 gap-2">
              <span className="text-xs font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: `${color}20`, color }}
              >
                {band}
              </span>
            </div>

            {/* Major factor description */}
            {major_factor && (
              <p
                className="text-[12px] text-muted-foreground mb-1.5 leading-relaxed italic border-l-2 pl-2"
                style={{ borderColor: color }}
              >
                {major_factor}
              </p>
            )}

            {/* Bullet List of Reasons */}
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[12px] text-foreground/90 leading-snug">
                    {r}
                  </span>
                </li>
              ))}
            </ul>

            {/* Tooltip caret tail */}
            <div
              ref={caretRef}
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
