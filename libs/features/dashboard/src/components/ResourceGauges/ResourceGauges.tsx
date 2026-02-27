/**
 * ResourceGauges Component
 * @description Real-time resource utilization gauges with threshold-based coloring
 * Displays CPU, Memory, Storage, and Temperature with responsive layout
 *
 * AC 5.2.1: Real-time resource gauges for CPU, Memory, Storage, Temperature
 * AC 5.2.3: Colors change based on configurable thresholds
 * AC 5.2.4: Click CPU gauge to see per-core breakdown
 * AC 5.2.5: Temperature gauge hidden if not supported
 *
 * Pattern: Headless + Platform Presenters (ADR-018)
 * - useResourceMetrics: Headless data hook
 * - ResourceGaugesDesktop: Desktop presenter (4-column grid)
 * - ResourceGaugesMobile: Mobile presenter (2x2 grid)
 */

import { useState, useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { Skeleton } from '@nasnet/ui/primitives';
import { CircularGauge } from './CircularGauge';
import { CPUBreakdownModal } from './CPUBreakdownModal';
import { useResourceMetrics } from './useResourceMetrics';
import { cn } from '@nasnet/ui/utils';

/**
 * ResourceGauges props
 */
export interface ResourceGaugesProps {
  /** Router device ID */
  deviceId: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AC 5.2.3: Default thresholds for each resource type
 */
const THRESHOLDS = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 80, critical: 95 },
  storage: { warning: 85, critical: 95 },
  temperature: { warning: 60, critical: 75 },
} as const;

/**
 * Desktop Presenter
 * 4-column grid layout with larger gauges (md size)
 */
function ResourceGaugesDesktop({ deviceId, className }: ResourceGaugesProps) {
  const { metrics, loading, raw } = useResourceMetrics(deviceId);
  const [showCPUModal, setShowCPUModal] = useState(false);
  const handleShowCPUModal = useCallback(() => setShowCPUModal(true), []);
  const handleCPUModalChange = useCallback((open: boolean) => setShowCPUModal(open), []);

  if (loading || !metrics) {
    return (
      <div className={cn('gap-component-xl grid grid-cols-4', className)}>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('gap-component-xl grid grid-cols-4', className)}>
        {/* CPU Gauge - clickable to show breakdown */}
        <CircularGauge
          value={metrics.cpu.usage}
          label="CPU"
          sublabel={metrics.cpu.formatted}
          thresholds={THRESHOLDS.cpu}
          size="md"
          onClick={handleShowCPUModal}
        />

        {/* Memory Gauge */}
        <CircularGauge
          value={metrics.memory.percentage}
          label="Memory"
          sublabel={metrics.memory.formatted}
          thresholds={THRESHOLDS.memory}
          size="md"
        />

        {/* Storage Gauge */}
        <CircularGauge
          value={metrics.storage.percentage}
          label="Storage"
          sublabel={metrics.storage.formatted}
          thresholds={THRESHOLDS.storage}
          size="md"
        />

        {/* Temperature Gauge - AC 5.2.5: Hidden if not supported */}
        {metrics.hasTemperature && metrics.temperature != null && (
          <CircularGauge
            value={Math.min(100, (metrics.temperature / 100) * 100)} // Normalize to 0-100
            label="Temperature"
            sublabel={`${metrics.temperature}°C`}
            thresholds={THRESHOLDS.temperature}
            size="md"
          />
        )}
      </div>

      {/* AC 5.2.4: CPU Breakdown Modal */}
      {raw?.cpu.perCore && (
        <CPUBreakdownModal
          open={showCPUModal}
          onOpenChange={handleCPUModalChange}
          perCoreUsage={raw.cpu.perCore}
          overallUsage={metrics.cpu.usage}
          frequency={raw.cpu.frequency}
        />
      )}
    </>
  );
}

/**
 * Mobile Presenter
 * 2x2 grid layout with smaller gauges (sm size)
 */
function ResourceGaugesMobile({ deviceId, className }: ResourceGaugesProps) {
  const { metrics, loading, raw } = useResourceMetrics(deviceId);
  const [showCPUModal, setShowCPUModal] = useState(false);
  const handleShowCPUModal = useCallback(() => setShowCPUModal(true), []);
  const handleCPUModalChange = useCallback((open: boolean) => setShowCPUModal(open), []);

  if (loading || !metrics) {
    return (
      <div className={cn('gap-component-md grid grid-cols-2', className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('gap-component-md grid grid-cols-2', className)}>
        {/* CPU Gauge - clickable to show breakdown */}
        <CircularGauge
          value={metrics.cpu.usage}
          label="CPU"
          sublabel={`${metrics.cpu.cores} core${metrics.cpu.cores > 1 ? 's' : ''}`}
          thresholds={THRESHOLDS.cpu}
          size="sm"
          onClick={handleShowCPUModal}
        />

        {/* Memory Gauge */}
        <CircularGauge
          value={metrics.memory.percentage}
          label="Memory"
          sublabel={metrics.memory.formatted}
          thresholds={THRESHOLDS.memory}
          size="sm"
        />

        {/* Storage Gauge */}
        <CircularGauge
          value={metrics.storage.percentage}
          label="Storage"
          sublabel={metrics.storage.formatted}
          thresholds={THRESHOLDS.storage}
          size="sm"
        />

        {/* Temperature Gauge - AC 5.2.5: Hidden if not supported */}
        {metrics.hasTemperature && metrics.temperature != null && (
          <CircularGauge
            value={Math.min(100, (metrics.temperature / 100) * 100)} // Normalize to 0-100
            label="Temp"
            sublabel={`${metrics.temperature}°C`}
            thresholds={THRESHOLDS.temperature}
            size="sm"
          />
        )}
      </div>

      {/* AC 5.2.4: CPU Breakdown Modal */}
      {raw?.cpu.perCore && (
        <CPUBreakdownModal
          open={showCPUModal}
          onOpenChange={handleCPUModalChange}
          perCoreUsage={raw.cpu.perCore}
          overallUsage={metrics.cpu.usage}
          frequency={raw.cpu.frequency}
        />
      )}
    </>
  );
}

/**
 * ResourceGauges Main Component
 * Auto-detects platform and delegates to appropriate presenter
 *
 * Pattern: Headless + Platform Presenters (ADR-018)
 */
export const ResourceGauges = function ResourceGauges(props: ResourceGaugesProps) {
  const platform = usePlatform();

  // Mobile and tablet use mobile presenter (touch-optimized)
  if (platform === 'mobile' || platform === 'tablet') {
    return <ResourceGaugesMobile {...props} />;
  }

  // Desktop uses desktop presenter (pro-grade density)
  return <ResourceGaugesDesktop {...props} />;
};

ResourceGauges.displayName = 'ResourceGauges';
