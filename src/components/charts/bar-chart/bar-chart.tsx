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
}

// keeps the tooltip inside the canvas near the edges and on tall bars
function tooltipClassName(centerPercent: number, barFraction: number): string {
  const classNames = [styles.tooltip];
  if (barFraction > 0.75) classNames.push(styles.tooltipBelowTip);
  if (centerPercent < 10) classNames.push(styles.tooltipLeftEdge);
  else if (centerPercent > 90) classNames.push(styles.tooltipRightEdge);
  return classNames.join(" ");
}

// axis labels and tooltip are HTML, not SVG <text>: the SVG stretches with
// preserveAspectRatio="none", which would distort text glyphs
export function BarChart({
  points,
  xDomain,
  ariaLabel,
  emptyMessage,
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
          role="img"
          aria-label={ariaLabel}
          className={styles.chart}
        >
          {points.map((point) => (
            <rect
              key={point.x}
              className={styles.bar}
              x={xScale(point.x)}
              y={CHART_HEIGHT - barHeightOf(point)}
              width={BAR_WIDTH}
              height={barHeightOf(point)}
              rx={BAR_WIDTH / 2}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>
        {hoveredPoint !== null && (
          <div
            className={tooltipClassName(
              barCenterPercent(hoveredPoint),
              barHeightOf(hoveredPoint) / CHART_HEIGHT,
            )}
            style={{
              left: `${barCenterPercent(hoveredPoint)}%`,
              bottom: `${(barHeightOf(hoveredPoint) / CHART_HEIGHT) * 100}%`,
            }}
          >
            <div>{hoveredPoint.label ?? String(hoveredPoint.y)}</div>
            {hoveredPoint.sublabel !== undefined && (
              <div className={styles.tooltipSublabel}>
                {hoveredPoint.sublabel}
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
