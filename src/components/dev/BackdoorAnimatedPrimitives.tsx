"use client";

import React, { useEffect, useState, useRef, useMemo, useId } from "react";

interface AnimatedStatNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
  locale?: string;
}

/**
 * Animated number that rises smoothly from 0 (minimum value) to the target destination value.
 */
export function AnimatedStatNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1200,
  className = "",
  locale = "es-CR",
}: AnimatedStatNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const startTime = performance.now();
    setDisplayValue(0);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out for smooth deceleration at destination
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, durationMs]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimals > 0 ? Number(displayValue.toFixed(decimals)) : Math.round(displayValue));

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface HatchedProgressBarProps {
  current: number;
  max: number;
  animKey?: string | number;
  barColorClass?: string;
}

/**
 * Matches the Vertix "Monthly Spending Limit" bar:
 * Diagonal hatched track with an orange capsule bar charging from 0% to target %.
 */
export function VertixHatchedProgressBar({
  current,
  max,
  animKey,
  barColorClass = "bg-gradient-to-r from-[#FF6B35] to-[#E53E1A]",
}: HatchedProgressBarProps) {
  const [chargedPercent, setChargedPercent] = useState(0);
  const targetPercent = max > 0 ? Math.min(100, Math.max(6, Math.round((current / max) * 100))) : 0;

  useEffect(() => {
    setChargedPercent(0);
    const timer = setTimeout(() => {
      setChargedPercent(current <= 0 ? 0 : targetPercent);
    }, 60);
    return () => clearTimeout(timer);
  }, [current, max, targetPercent, animKey]);

  return (
    <div
      className="relative w-full h-3.5 rounded-full overflow-hidden bg-[#F4F4F6]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-55deg, #E2E2E6 0px, #E2E2E6 1.5px, transparent 1.5px, transparent 5px)",
      }}
    >
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-xs ${barColorClass}`}
        style={{ width: `${chargedPercent}%` }}
      />
    </div>
  );
}

export interface LineChartDatum {
  key: string;
  label: string;
  subLabel?: string;
  primaryValue: number; // Primary curve (e.g. Profit, Gross or Primary stat)
  secondaryValue: number; // Secondary curve (e.g. Base/Cost or Secondary comparison)
  tooltipPrimaryLabel: string;
  tooltipSecondaryLabel?: string;
}

// Backward compatibility alias
export type CapsuleBarDatum = LineChartDatum;

export interface VertixLineChartProps {
  data: LineChartDatum[];
  title?: string;
  primaryLegendLabel: string;
  secondaryLegendLabel?: string;
  currencyPrefix?: string;
  isCountMetric?: boolean;
  animTriggerKey?: string;
  heightClass?: string;
  variant?: "plain" | "card";
}

function formatAxisCompact(val: number, prefix = ""): string {
  if (val <= 0) return `${prefix}0`;
  if (val >= 1_000_000) {
    return `${prefix}${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (val >= 1_000) {
    return `${prefix}${Math.round(val / 1_000)}k`;
  }
  return `${prefix}${Math.round(val)}`;
}

/**
 * Builds a strictly-clamped smooth Catmull-Rom Bezier spline curve.
 * Guarantees that:
 * 1. Zero values stay flat on the baseline axis.
 * 2. Control points never dip below baseY or poke above top boundary.
 * 3. Never produces wild loops or overshoots.
 */
function buildClampedSmoothPath(
  points: { x: number; y: number; originalVal: number }[],
  baseY: number,
  padTop: number
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    // If both adjacent points are zero, keep the line flat on the baseline
    if (p1.originalVal <= 0 && p2.originalVal <= 0) {
      d += ` L ${p2.x.toFixed(1)} ${baseY.toFixed(1)}`;
      continue;
    }

    let cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    let cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Strict boundary clamping so line never dips below baseline
    cp1y = Math.min(baseY, Math.max(padTop, cp1y));
    cp2y = Math.min(baseY, Math.max(padTop, cp2y));

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Builds a closed SVG area polygon underneath the curve down to the baseline Y.
 */
function buildAreaPath(
  points: { x: number; y: number; originalVal: number }[],
  baseY: number,
  padTop: number
): string {
  if (points.length === 0) return "";
  const linePath = buildClampedSmoothPath(points, baseY, padTop);
  const firstX = points[0].x.toFixed(1);
  const lastX = points[points.length - 1].x.toFixed(1);
  return `${linePath} L ${lastX} ${baseY.toFixed(1)} L ${firstX} ${baseY.toFixed(1)} Z`;
}

/**
 * VertixLineChart:
 * Elegant, high-precision SVG line graph replacing bar charts.
 * Features:
 * - Smooth clamped cubic spline curves that never dip below baseline or overflow container
 * - Strict overflow-hidden boundary to prevent any visual leaking into neighboring cards
 * - Dual series support (Primary in #F05526, Secondary in #141414)
 * - Rise animation from minimum baseline up to target destination (Rule 8)
 * - Interactive hover crosshair with point dots and floating tooltip card
 * - Clean dashed guide lines and compact unique Y-axis labels
 */
export function VertixLineChart({
  data,
  title,
  primaryLegendLabel,
  secondaryLegendLabel,
  currencyPrefix = "₡",
  isCountMetric = false,
  animTriggerKey = "",
  heightClass = "h-52",
  variant = "plain",
}: VertixLineChartProps) {
  const gradientId = useId().replace(/:/g, "-");
  const [animProgress, setAnimProgress] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Animate lines rising from minimum (0) up to target values
  useEffect(() => {
    setAnimProgress(0);
    const startTime = performance.now();
    const duration = 900; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setAnimProgress(1);
      }
    };

    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, 40);

    return () => {
      clearTimeout(timer);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animTriggerKey, data.length]);

  // Determine maximum ceiling for vertical scale
  const rawMax = Math.max(
    1,
    ...data.map((d) => Math.max(d.primaryValue, d.secondaryValue || 0))
  );

  // For small count metrics (e.g. 1 or 2 orders), ensure scale is at least 4 so ticks don't duplicate
  const effectiveMax = isCountMetric ? Math.max(4, rawMax) : Math.max(1, Math.round(rawMax * 1.15));

  // Generate 5 evenly-spaced ticks
  const rawTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => Math.round(effectiveMax * ratio));
  // Deduplicate ticks to prevent UI clutter like [2, 2, 1, 1, 0]
  const yTicks = Array.from(new Set(rawTicks));

  const prefix = isCountMetric ? "" : currencyPrefix;

  // Internal SVG coordinate space
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 200;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 14;
  const plotWidth = SVG_WIDTH - padLeft - padRight;
  const plotHeight = SVG_HEIGHT - padTop - padBottom;
  const baseY = padTop + plotHeight;

  const hasSecondary = useMemo(() => {
    return Boolean(secondaryLegendLabel && data.some((d) => d.secondaryValue > 0));
  }, [secondaryLegendLabel, data]);

  // Calculate coordinates for all data points
  const { primaryPoints, secondaryPoints } = useMemo(() => {
    const N = data.length;
    const primPts: { x: number; y: number; originalVal: number }[] = [];
    const secPts: { x: number; y: number; originalVal: number }[] = [];

    data.forEach((item, idx) => {
      const x = N > 1 ? padLeft + (idx / (N - 1)) * plotWidth : padLeft + plotWidth / 2;

      // Primary Point
      const targetYPrimary = baseY - (Math.max(0, item.primaryValue) / effectiveMax) * plotHeight;
      const currentYPrimary = baseY - (baseY - targetYPrimary) * animProgress;
      primPts.push({
        x,
        y: Math.min(baseY, Math.max(padTop, currentYPrimary)),
        originalVal: item.primaryValue,
      });

      // Secondary Point
      const targetYSecondary = baseY - (Math.max(0, item.secondaryValue || 0) / effectiveMax) * plotHeight;
      const currentYSecondary = baseY - (baseY - targetYSecondary) * animProgress;
      secPts.push({
        x,
        y: Math.min(baseY, Math.max(padTop, currentYSecondary)),
        originalVal: item.secondaryValue || 0,
      });
    });

    return { primaryPoints: primPts, secondaryPoints: secPts };
  }, [data, effectiveMax, animProgress, plotWidth, plotHeight, baseY, padLeft, padTop]);

  // Smooth SVG Path definitions (Strictly clamped to baseline)
  const primaryLinePath = useMemo(
    () => buildClampedSmoothPath(primaryPoints, baseY, padTop),
    [primaryPoints, baseY, padTop]
  );
  const primaryAreaPath = useMemo(
    () => buildAreaPath(primaryPoints, baseY, padTop),
    [primaryPoints, baseY, padTop]
  );

  const secondaryLinePath = useMemo(
    () => (hasSecondary ? buildClampedSmoothPath(secondaryPoints, baseY, padTop) : ""),
    [hasSecondary, secondaryPoints, baseY, padTop]
  );
  const secondaryAreaPath = useMemo(
    () => (hasSecondary ? buildAreaPath(secondaryPoints, baseY, padTop) : ""),
    [hasSecondary, secondaryPoints, baseY, padTop]
  );

  const isCard = variant === "card";

  return (
    <div
      className={
        isCard
          ? "bg-[#F6F6F8] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between relative overflow-visible"
          : "w-full flex flex-col justify-between relative overflow-visible"
      }
    >
      {/* Header & Legend */}
      <div className={`flex flex-wrap items-center gap-2 mb-3 ${title ? "justify-between" : "justify-end"}`}>
        {title ? (
          <span className="text-xs sm:text-sm font-bold text-[#141414] tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F05526]" />
            <span>{title}</span>
          </span>
        ) : null}

        <div className="flex items-center gap-3.5 text-[11px] font-semibold text-neutral-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#F05526] inline-block shadow-2xs" />
            <span>{primaryLegendLabel}</span>
          </span>
          {secondaryLegendLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded-full bg-[#141414] inline-block shadow-2xs" />
              <span>{secondaryLegendLabel}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className={`relative flex flex-col justify-between w-full ${heightClass}`}>
        <div className="relative flex-1 flex items-stretch gap-2 min-h-0">
          {/* Y-Axis Labels Column */}
          <div className="flex flex-col justify-between text-[10px] font-medium text-neutral-400 select-none shrink-0 z-10 w-8 sm:w-9 pr-1">
            {yTicks.map((tick, idx) => (
              <span key={idx} className="leading-none text-right">
                {formatAxisCompact(tick, prefix)}
              </span>
            ))}
          </div>

          {/* Plot Area */}
          <div className="relative flex-1 h-full min-h-0 overflow-visible">
            {/* Horizontal Faint Guide Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {yTicks.map((_, idx) => (
                <div key={idx} className="w-full border-b border-black/[0.04] border-dashed" />
              ))}
            </div>

            {/* SVG Curve Canvas - Contained strictly within the plot box */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <defs>
                  {/* Primary Orange Gradient Fill */}
                  <linearGradient id={`${gradientId}-primary`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F05526" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#F05526" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#F05526" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Secondary Dark Charcoal Gradient Fill */}
                  <linearGradient id={`${gradientId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#141414" stopOpacity="0.14" />
                    <stop offset="70%" stopColor="#141414" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="#141414" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Secondary Area & Line */}
                {hasSecondary && (
                  <>
                    <path
                      d={secondaryAreaPath}
                      fill={`url(#${gradientId}-secondary)`}
                      className="transition-opacity duration-300"
                    />
                    <path
                      d={secondaryLinePath}
                      fill="none"
                      stroke="#141414"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}

                {/* Primary Area & Line */}
                <path
                  d={primaryAreaPath}
                  fill={`url(#${gradientId}-primary)`}
                  className="transition-opacity duration-300"
                />
                <path
                  d={primaryLinePath}
                  fill="none"
                  stroke="#F05526"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Vertical Dashed Crosshair when Hovered */}
                {hoveredIdx !== null && primaryPoints[hoveredIdx] && (
                  <line
                    x1={primaryPoints[hoveredIdx].x}
                    y1={padTop}
                    x2={primaryPoints[hoveredIdx].x}
                    y2={baseY}
                    stroke="#141414"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.3}
                  />
                )}

                {/* Point Markers on Curves */}
                {primaryPoints.map((pt, idx) => {
                  const isHovered = hoveredIdx === idx;
                  const secPt = secondaryPoints[idx];

                  return (
                    <g key={`pt-${idx}`}>
                      {/* Secondary Point Dot */}
                      {hasSecondary && secPt && (
                        <circle
                          cx={secPt.x}
                          cy={secPt.y}
                          r={isHovered ? 4 : 2}
                          fill="#FFFFFF"
                          stroke="#141414"
                          strokeWidth={isHovered ? 2 : 1.5}
                          className="transition-all duration-150"
                        />
                      )}

                      {/* Primary Point Dot */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5 : 3}
                        fill="#FFFFFF"
                        stroke="#F05526"
                        strokeWidth={isHovered ? 2 : 1.5}
                        className="transition-all duration-150"
                      />

                      {/* Glowing Ring for Hovered Primary Point */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={8}
                          fill="#F05526"
                          fillOpacity={0.2}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Slices & Floating Tooltip (Overflow-visible so values are 100% visible) */}
            <div className="absolute inset-0 flex items-stretch z-30 overflow-visible">
              {data.map((item, idx) => {
                const isHovered = hoveredIdx === idx;
                const totalVal = item.primaryValue + (item.secondaryValue || 0);

                const primY = primaryPoints[idx]?.y ?? baseY;
                const secY = secondaryPoints[idx]?.y ?? baseY;
                const minY = hasSecondary ? Math.min(primY, secY) : primY;
                // If peak is in top 45% of plot height, place tooltip below to never get cut off
                const isNearTop = minY < SVG_HEIGHT * 0.45;

                const alignClass =
                  idx === 0
                    ? "left-0 translate-x-0"
                    : idx === data.length - 1
                    ? "right-0 left-auto translate-x-0"
                    : "left-1/2 -translate-x-1/2";

                return (
                  <div
                    key={`slice-${item.key}`}
                    className="flex-1 relative flex flex-col justify-end cursor-crosshair group overflow-visible"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Floating Tooltip Card - Fully visible without clipping */}
                    {isHovered && (
                      <div
                        className={`absolute z-50 bg-[#141414] text-white text-[10px] rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap pointer-events-none border border-white/15 animate-in fade-in zoom-in-95 duration-100 ${alignClass} ${
                          isNearTop ? "top-10" : "-top-20"
                        }`}
                      >
                        <p className="font-bold text-neutral-300 pb-1 border-b border-white/10 text-[11px]">
                          {item.subLabel || item.label}
                        </p>
                        <div className="pt-1 space-y-0.5">
                          <p className="font-semibold text-[#FF7347] flex items-center justify-between gap-3 text-[11px]">
                            <span>{item.tooltipPrimaryLabel}:</span>
                            <span className="font-bold">
                              {prefix}
                              {item.primaryValue.toLocaleString("en-US")}
                            </span>
                          </p>
                          {secondaryLegendLabel && item.tooltipSecondaryLabel && (
                            <p className="font-medium text-neutral-300 flex items-center justify-between gap-3 text-[11px]">
                              <span>{item.tooltipSecondaryLabel}:</span>
                              <span className="font-bold">
                                {prefix}
                                {(item.secondaryValue || 0).toLocaleString("en-US")}
                              </span>
                            </p>
                          )}
                          {hasSecondary && (
                            <p className="font-bold text-white pt-1 mt-0.5 border-t border-white/15 flex items-center justify-between gap-3 text-[11px]">
                              <span>Total:</span>
                              <span className="text-emerald-400">
                                {prefix}
                                {totalVal.toLocaleString("en-US")}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* X-Axis Labels Row */}
        <div className="flex items-center justify-between pt-2 pl-8 sm:pl-9 select-none shrink-0">
          {data.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <span
                key={`label-${item.key}`}
                className={`text-[10px] leading-none transition-colors text-center flex-1 truncate px-0.5 ${
                  isHovered ? "text-[#141414] font-bold" : "text-neutral-500 font-medium"
                }`}
                title={item.subLabel || item.label}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Seamless alias so existing references immediately render the high-end Line Graph
export const VertixCapsuleBarChart = VertixLineChart;
