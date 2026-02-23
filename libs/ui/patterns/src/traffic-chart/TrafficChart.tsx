/**
 * Traffic Chart Component
 *
 * Line chart component for visualizing network bandwidth (download/upload) over time.
 * Built with SVG for performance and to stay within bundle size constraints.
 *
 * Features:
 * - Responsive SVG rendering with auto-scaling Y-axis
 * - Dual-line display: cyan (download), purple (upload)
 * - Area fill gradients for visual clarity
 * - Current speed summary display
 * - Dashed grid lines
 * - "Sample data" indicator for placeholder mode
 * - Fully responsive viewport
 *
 * @module @nasnet/ui/patterns/traffic-chart
 */

import * as React from 'react';

import { Activity, ArrowDown, ArrowUp, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, cn } from '@nasnet/ui/primitives';

/**
 * Single data point for traffic chart
 *
 * Represents bandwidth at a single point in time
 */
export interface TrafficDataPoint {
  /** Timestamp or time label (e.g., "-1h", "-50m", "now") */
  time: string;
  /** Download speed in Mb/s */
  download: number;
  /** Upload speed in Mb/s */
  upload: number;
}

/**
 * Props for TrafficChart component
 */
export interface TrafficChartProps {
  /** Array of traffic data points to visualize */
  data?: TrafficDataPoint[];
  /** Chart title displayed in card header */
  title?: string;
  /** Whether to display loading skeleton (reserved for future use) */
  isLoading?: boolean;
  /** Show placeholder data and "Sample data" badge when no real data is available */
  showPlaceholder?: boolean;
  /** Height of the chart SVG area in pixels */
  height?: number;
  /** Additional CSS classes for the card wrapper */
  className?: string;
}

// Default placeholder data simulating traffic over last hour
const defaultPlaceholderData: TrafficDataPoint[] = [
  { time: '-1h', download: 45, upload: 12 },
  { time: '-50m', download: 62, upload: 18 },
  { time: '-40m', download: 38, upload: 22 },
  { time: '-30m', download: 78, upload: 35 },
  { time: '-20m', download: 55, upload: 28 },
  { time: '-10m', download: 68, upload: 42 },
  { time: 'now', download: 72, upload: 38 },
];

/**
 * Format bandwidth value to human-readable string
 *
 * Values >= 1000 are displayed as Gb/s, otherwise as Mb/s
 */
const formatBandwidth = (value: number): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} Gb/s`;
  }
  return `${value} Mb/s`;
};

/**
 * Generate SVG path for line chart
 *
 * Creates a polyline path from data points, scaling to fit the chart dimensions
 */
const generatePath = (
  data: TrafficDataPoint[],
  key: 'download' | 'upload',
  width: number,
  height: number,
  maxValue: number
): string => {
  if (data.length === 0) return '';

  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = height - padding - (point[key] / maxValue) * chartHeight;
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
};

/**
 * Generate area fill path for line chart
 *
 * Creates a closed path that forms the area between the line and the baseline
 */
const generateAreaPath = (
  data: TrafficDataPoint[],
  key: 'download' | 'upload',
  width: number,
  height: number,
  maxValue: number
): string => {
  if (data.length === 0) return '';

  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = height - padding - (point[key] / maxValue) * chartHeight;
    return `${x},${y}`;
  });

  const startX = padding;
  const endX = padding + chartWidth;
  const baseline = height - padding;

  return `M ${startX},${baseline} L ${points.join(' L ')} L ${endX},${baseline} Z`;
};

/**
 * TrafficChart Component
 *
 * Displays network traffic visualization with dual download/upload lines and area fills.
 * Auto-scales the Y-axis based on data range and includes current speed summary.
 *
 * @example
 * ```tsx
 * <TrafficChart
 *   data={trafficHistory}
 *   title="WAN Throughput"
 *   height={120}
 * />
 * ```
 */
const TrafficChartInner = React.forwardRef<
  HTMLDivElement,
  TrafficChartProps
>(
  ({
    data,
    title = 'Network Traffic',
    isLoading: _isLoading = false,
    showPlaceholder = true,
    height = 120,
    className,
  }, ref) => {
    const chartData = data || (showPlaceholder ? defaultPlaceholderData : []);
    const maxValue = React.useMemo(
      () =>
        Math.max(
          ...chartData.flatMap((d) => [d.download, d.upload]),
          100
        ) * 1.1, // Add 10% padding
      [chartData]
    );

    // Get current values for display
    const currentDownload = React.useMemo(
      () => (chartData.length > 0 ? chartData[chartData.length - 1].download : 0),
      [chartData]
    );
    const currentUpload = React.useMemo(
      () => (chartData.length > 0 ? chartData[chartData.length - 1].upload : 0),
      [chartData]
    );

    // Chart dimensions
    const chartWidth = 280;

    return (
      <Card ref={ref} className={cn('h-full', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </div>
            {showPlaceholder && !data && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>Sample data</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Current Stats */}
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-statusConnected" />
              <div>
                <p className="text-lg font-bold text-foreground">{formatBandwidth(currentDownload)}</p>
                <p className="text-xs text-muted-foreground">Download</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-warning" />
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{formatBandwidth(currentUpload)}</p>
                <p className="text-xs text-muted-foreground">Upload</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${height}`}
              className="w-full"
              style={{ height: `${height}px` }}
              preserveAspectRatio="none"
            >
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="downloadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map((ratio, i) => (
                <line
                  key={i}
                  x1="10"
                  y1={height - 10 - ratio * (height - 20)}
                  x2={chartWidth - 10}
                  y2={height - 10 - ratio * (height - 20)}
                  className="stroke-border"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Download area fill */}
              <path
                d={generateAreaPath(chartData, 'download', chartWidth, height, maxValue)}
                fill="url(#downloadGradient)"
                className="transition-all duration-500"
              />

              {/* Upload area fill */}
              <path
                d={generateAreaPath(chartData, 'upload', chartWidth, height, maxValue)}
                fill="url(#uploadGradient)"
                className="transition-all duration-500"
              />

              {/* Download line */}
              <path
                d={generatePath(chartData, 'download', chartWidth, height, maxValue)}
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />

              {/* Upload line */}
              <path
                d={generatePath(chartData, 'upload', chartWidth, height, maxValue)}
                fill="none"
                stroke="hsl(var(--warning))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />

              {/* Data points - Download */}
              {chartData.map((point, index) => {
                const x = 10 + (index / (chartData.length - 1)) * (chartWidth - 20);
                const y = height - 10 - (point.download / maxValue) * (height - 20);
                return (
                  <circle
                    key={`dl-${index}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="hsl(var(--success))"
                    className="transition-all duration-500"
                  />
                );
              })}

              {/* Data points - Upload */}
              {chartData.map((point, index) => {
                const x = 10 + (index / (chartData.length - 1)) * (chartWidth - 20);
                const y = height - 10 - (point.upload / maxValue) * (height - 20);
                return (
                  <circle
                    key={`ul-${index}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="hsl(var(--warning))"
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            {/* Time labels */}
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{chartData.length > 0 ? chartData[0].time : ''}</span>
              <span>{chartData.length > 0 ? chartData[chartData.length - 1].time : ''}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Download</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span>Upload</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

TrafficChartInner.displayName = 'TrafficChart';

/**
 * TrafficChart - Network traffic visualization component
 */
const TrafficChart = React.memo(TrafficChartInner);
TrafficChart.displayName = 'TrafficChart';

export { TrafficChart };

