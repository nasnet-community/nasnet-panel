import React, { useRef, useState } from 'react';
import styles from './TrafficChart.module.scss';

export interface TrafficChartPoint {
  t: number;
  rxKbps: number;
  txKbps: number;
}

export interface TrafficChartColors {
  success: string;
  warning: string;
  border: string;
}

export interface TrafficChartProps {
  data: TrafficChartPoint[];
  colors: TrafficChartColors;
  formatValue?: (kbps: number) => string;
  rxLabel?: string;
  txLabel?: string;
}

const CHART_W = 100;
const CHART_H = 40;
const GRID_ROWS = 4;

const defaultFormat = (kbps: number) => `${(kbps / 1000).toFixed(2)} Mb/s`;

export const TrafficChart: React.FC<TrafficChartProps> = ({
  data,
  colors,
  formatValue = defaultFormat,
  rxLabel = '↓',
  txLabel = '↑',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const yMax = Math.max(1, ...data.map((p) => Math.max(p.rxKbps, p.txKbps)));
  const stepX = data.length > 1 ? CHART_W / (data.length - 1) : 0;
  const toY = (v: number) => CHART_H - (v / yMax) * CHART_H;

  const rxLine = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(p.rxKbps)}`)
    .join(' ');
  const txLine = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(p.txKbps)}`)
    .join(' ');
  const rxArea = `${rxLine} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
  const txArea = `${txLine} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hoverPoint = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? hoverIdx * stepX : 0;
  const tooltipLeftPct = CHART_W > 0 ? (hoverX / CHART_W) * 100 : 0;

  const timeLabel = hoverPoint
    ? new Date(hoverPoint.t).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <div className={styles.chartInner}>
      <svg
        ref={svgRef}
        className={styles.chartSvg}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="traffic-chart-rx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.success} stopOpacity={0.55} />
            <stop offset="100%" stopColor={colors.success} stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="traffic-chart-tx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.warning} stopOpacity={0.55} />
            <stop offset="100%" stopColor={colors.warning} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {Array.from({ length: GRID_ROWS + 1 }, (_, i) => {
          const y = (i / GRID_ROWS) * CHART_H;
          return (
            <line
              key={`grid-${y}`}
              x1={0}
              y1={y}
              x2={CHART_W}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.3}
              strokeDasharray="1 1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <path d={rxArea} fill="url(#traffic-chart-rx)" />
        <path d={txArea} fill="url(#traffic-chart-tx)" />
        <path
          d={rxLine}
          fill="none"
          stroke={colors.success}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={txLine}
          fill="none"
          stroke={colors.warning}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {hoverIdx !== null ? (
          <line
            x1={hoverX}
            y1={0}
            x2={hoverX}
            y2={CHART_H}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>
      {hoverPoint ? (
        <>
          <span
            className={styles.chartDot}
            style={{
              left: `${tooltipLeftPct}%`,
              top: `${(toY(hoverPoint.rxKbps) / CHART_H) * 100}%`,
              background: colors.success,
            }}
          />
          <span
            className={styles.chartDot}
            style={{
              left: `${tooltipLeftPct}%`,
              top: `${(toY(hoverPoint.txKbps) / CHART_H) * 100}%`,
              background: colors.warning,
            }}
          />
        </>
      ) : null}
      {hoverPoint ? (
        <div className={styles.chartTooltip} style={{ left: `${tooltipLeftPct}%` }} role="status">
          <div className={styles.chartTooltipTime}>{timeLabel}</div>
          <div className={styles.chartTooltipRow}>
            <span className={styles.chartLegendSwatch} style={{ background: colors.success }} />
            <span>
              {rxLabel} {formatValue(hoverPoint.rxKbps)}
            </span>
          </div>
          <div className={styles.chartTooltipRow}>
            <span className={styles.chartLegendSwatch} style={{ background: colors.warning }} />
            <span>
              {txLabel} {formatValue(hoverPoint.txKbps)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
