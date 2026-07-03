import { scaleLinear } from "d3-scale";
import styles from "./style.module.css";

const CHART_WIDTH = 476;
const CHART_HEIGHT = 203;
const BAR_WIDTH = 4;

export interface BarChartPoint {
  x: number;
  y: number;
  label?: string;
}

interface BarChartProps {
  points: BarChartPoint[];
  xDomain: [number, number];
  ariaLabel: string;
  emptyMessage: string;
}

// D3 for math, React for DOM: scales computed here, SVG rendered by React.
export function BarChart({
  points,
  xDomain,
  ariaLabel,
  emptyMessage,
}: BarChartProps) {
  if (points.length === 0) {
    return <p className={styles.emptyNote}>{emptyMessage}</p>;
  }

  const maxValue = Math.max(...points.map((point) => point.y));
  const xScale = scaleLinear()
    .domain(xDomain)
    .range([0, CHART_WIDTH - BAR_WIDTH]);
  const yScale = scaleLinear().domain([0, maxValue]).range([0, CHART_HEIGHT]);

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
      className={styles.chart}
    >
      {points.map((point) => {
        const barHeight =
          point.y > 0 ? Math.max(yScale(point.y), BAR_WIDTH) : 0;
        return (
          <rect
            key={point.x}
            className={styles.bar}
            x={xScale(point.x)}
            y={CHART_HEIGHT - barHeight}
            width={BAR_WIDTH}
            height={barHeight}
            rx={BAR_WIDTH / 2}
          >
            <title>{point.label ?? String(point.y)}</title>
          </rect>
        );
      })}
    </svg>
  );
}
