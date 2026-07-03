"use client";

import { useState } from "react";
import { scaleLinear } from "d3-scale";
import styles from "./style.module.css";

const CHART_WIDTH = 476;
const CHART_HEIGHT = 203;
const BAR_WIDTH = 4;

export interface BarChartPoint {
  x: number;
  y: number;
  label?: string;
  sublabel?: string;
  xLabel?: string;
}

interface BarChartProps {
  points: BarChartPoint[];
  xDomain: [number, number];
  ariaLabel: string;
  emptyMessage: string;
  highlightedX?: number;
  onPointSelect?: (point: BarChartPoint) => void;
}

function tooltipClassName(centerPercent: number, barFraction: number): string {
  const classNames = [styles.tooltip];
  if (barFraction > 0.75) classNames.push(styles.tooltipBelowTip);
  if (centerPercent < 10) classNames.push(styles.tooltipLeftEdge);
  else if (centerPercent > 90) classNames.push(styles.tooltipRightEdge);
  return classNames.join(" ");
}

export function BarChart({
  points,
  xDomain,
  ariaLabel,
  emptyMessage,
  highlightedX,
  onPointSelect,
}: BarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<BarChartPoint | null>(null);

  if (points.length === 0) {
    return <p className={styles.emptyNote}>{emptyMessage}</p>;
  }

  const maxValue = Math.max(...points.map((point) => point.y));
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([0, CHART_WIDTH - BAR_WIDTH]);
  const yScale = scaleLinear().domain([0, maxValue]).range([0, CHART_HEIGHT]);
  const labelledPoints = points.filter((point) => point.xLabel !== undefined);
  const highlightedPoint =
    points.find((point) => point.x === highlightedX) ?? null;
  const tooltipPoint = hoveredPoint ?? highlightedPoint;

  const barHeightOf = (point: BarChartPoint) =>
    point.y > 0 ? Math.max(yScale(point.y), BAR_WIDTH) : 0;
  const barCenterPercent = (point: BarChartPoint) =>
    ((xScale(point.x) + BAR_WIDTH / 2) / CHART_WIDTH) * 100;

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartCanvas}>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="group"
          aria-label={ariaLabel}
          className={styles.chart}
        >
          {points.map((point, pointIndex) => {
            const barHeight = barHeightOf(point);
            return (
              <rect
                key={point.x}
                className={
                  point.x === highlightedX
                    ? `${styles.bar} ${styles.barHighlighted}`
                    : styles.bar
                }
                style={{ animationDelay: `${pointIndex * 15}ms` }}
                x={xScale(point.x)}
                y={CHART_HEIGHT - barHeight}
                width={BAR_WIDTH}
                height={barHeight}
                rx={BAR_WIDTH / 2}
                tabIndex={0}
                aria-label={[point.label ?? String(point.y), point.sublabel]
                  .filter(Boolean)
                  .join(", ")}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onFocus={() => setHoveredPoint(point)}
                onBlur={() => setHoveredPoint(null)}
                onClick={onPointSelect ? () => onPointSelect(point) : undefined}
                onKeyDown={
                  onPointSelect
                    ? (event) => {
                        if (event.key !== "Enter") return;
                        onPointSelect(point);
                      }
                    : undefined
                }
              />
            );
          })}
        </svg>
        {tooltipPoint !== null && (
          <div
            className={tooltipClassName(
              barCenterPercent(tooltipPoint),
              barHeightOf(tooltipPoint) / CHART_HEIGHT,
            )}
            style={{
              left: `${barCenterPercent(tooltipPoint)}%`,
              bottom: `${(barHeightOf(tooltipPoint) / CHART_HEIGHT) * 100}%`,
            }}
          >
            <div className={styles.tooltipValue}>
              {tooltipPoint.label ?? String(tooltipPoint.y)}
            </div>
            {tooltipPoint.sublabel !== undefined && (
              <div className={styles.tooltipSublabel}>
                {tooltipPoint.sublabel}
              </div>
            )}
          </div>
        )}
      </div>
      {labelledPoints.length > 0 && (
        <div className={styles.xAxis} aria-hidden="true">
          {labelledPoints.map((point) => (
            <span
              key={point.x}
              className={styles.xAxisLabel}
              style={{ left: `${barCenterPercent(point)}%` }}
            >
              {point.xLabel}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
