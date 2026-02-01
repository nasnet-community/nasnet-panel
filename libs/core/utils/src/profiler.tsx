/**
 * @fileoverview React Profiler integration for development performance analysis
 *
 * Provides a wrapper component that monitors render times and logs warnings
 * when components exceed the 60fps budget (16ms per frame).
 *
 * This is a development tool and should not be used in production builds.
 *
 * @example
 * ```tsx
 * import { ProfilerWrapper } from '@nasnet/core/utils';
 *
 * // Wrap a component to monitor its render performance
 * <ProfilerWrapper id="VPNDashboard">
 *   <VPNDashboard />
 * </ProfilerWrapper>
 *
 * // Custom threshold
 * <ProfilerWrapper id="DataTable" onRenderThreshold={32}>
 *   <DataTable data={largeDataset} />
 * </ProfilerWrapper>
 *
 * // With custom handler
 * <ProfilerWrapper
 *   id="FirewallRules"
 *   onSlowRender={(info) => analytics.track('slow_render', info)}
 * >
 *   <FirewallRulesList />
 * </ProfilerWrapper>
 * ```
 */

import React, {
  Profiler,
  type ProfilerOnRenderCallback,
  type PropsWithChildren,
} from 'react';

/**
 * 60fps frame budget in milliseconds
 */
export const FRAME_BUDGET_MS = 16;

/**
 * Performance target for component renders
 */
export const RENDER_BUDGET_MS = 16;

/**
 * Information about a slow render
 */
export interface SlowRenderInfo {
  /** Component/profiler ID */
  id: string;
  /** Render phase (mount or update) */
  phase: 'mount' | 'update' | 'nested-update';
  /** Actual render duration in ms */
  actualDuration: number;
  /** Estimated render time without memoization */
  baseDuration: number;
  /** Time when render started */
  startTime: number;
  /** Time when render committed */
  commitTime: number;
  /** Budget exceeded by */
  exceededBy: number;
}

export interface ProfilerWrapperProps extends PropsWithChildren {
  /** Unique identifier for this profiler */
  id: string;
  /** Threshold in ms before warning (default: 16ms for 60fps) */
  onRenderThreshold?: number;
  /** Custom callback for slow renders */
  onSlowRender?: (info: SlowRenderInfo) => void;
  /** Whether to log warnings to console (default: true in development) */
  enableConsoleWarnings?: boolean;
  /** Whether the profiler is enabled (default: true in development) */
  enabled?: boolean;
}

/**
 * Wrapper component that profiles render performance in development
 *
 * Uses React's built-in Profiler API to measure render times and
 * logs warnings when renders exceed the frame budget.
 */
export function ProfilerWrapper({
  id,
  children,
  onRenderThreshold = RENDER_BUDGET_MS,
  onSlowRender,
  enableConsoleWarnings = true,
  enabled = process.env.NODE_ENV === 'development',
}: ProfilerWrapperProps) {
  // Skip profiling in production or when disabled
  if (!enabled) {
    return <>{children}</>;
  }

  const handleRender: ProfilerOnRenderCallback = (
    profilerId,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    if (actualDuration > onRenderThreshold) {
      const info: SlowRenderInfo = {
        id: profilerId,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        exceededBy: actualDuration - onRenderThreshold,
      };

      // Log to console in development
      if (enableConsoleWarnings) {
        console.warn(
          `[Profiler] %c${profilerId}%c exceeded render budget\n` +
            `  Phase: ${phase}\n` +
            `  Duration: ${actualDuration.toFixed(2)}ms (budget: ${onRenderThreshold}ms)\n` +
            `  Base duration: ${baseDuration.toFixed(2)}ms\n` +
            `  Exceeded by: ${info.exceededBy.toFixed(2)}ms`,
          'font-weight: bold; color: #ff6b6b',
          ''
        );
      }

      // Call custom handler if provided
      if (onSlowRender) {
        onSlowRender(info);
      }
    }
  };

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}

ProfilerWrapper.displayName = 'ProfilerWrapper';

/**
 * Hook for collecting render statistics
 *
 * Useful for aggregating performance data over time.
 *
 * @example
 * ```tsx
 * const { stats, reset, collectRender } = useRenderStats('DataTable');
 *
 * // Use with ProfilerWrapper
 * <ProfilerWrapper
 *   id="DataTable"
 *   onSlowRender={collectRender}
 * >
 *   <DataTable data={data} />
 * </ProfilerWrapper>
 *
 * // Log stats periodically
 * useEffect(() => {
 *   const interval = setInterval(() => {
 *     console.log('Render stats:', stats);
 *     reset();
 *   }, 10000);
 *   return () => clearInterval(interval);
 * }, [stats, reset]);
 * ```
 */
export function useRenderStats(id: string) {
  const [stats, setStats] = React.useState({
    renderCount: 0,
    slowRenderCount: 0,
    totalDuration: 0,
    maxDuration: 0,
    avgDuration: 0,
  });

  const collectRender = React.useCallback((info: SlowRenderInfo) => {
    setStats((prev) => {
      const newCount = prev.renderCount + 1;
      const newTotal = prev.totalDuration + info.actualDuration;

      return {
        renderCount: newCount,
        slowRenderCount: prev.slowRenderCount + 1,
        totalDuration: newTotal,
        maxDuration: Math.max(prev.maxDuration, info.actualDuration),
        avgDuration: newTotal / newCount,
      };
    });
  }, []);

  const reset = React.useCallback(() => {
    setStats({
      renderCount: 0,
      slowRenderCount: 0,
      totalDuration: 0,
      maxDuration: 0,
      avgDuration: 0,
    });
  }, []);

  return { stats, collectRender, reset };
}

/**
 * Higher-order component to wrap any component with profiling
 *
 * @example
 * ```tsx
 * const ProfiledDataTable = withProfiler(DataTable, 'DataTable');
 *
 * // Use with custom threshold
 * const ProfiledChart = withProfiler(Chart, 'Chart', { onRenderThreshold: 32 });
 * ```
 */
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string,
  options?: Omit<ProfilerWrapperProps, 'id' | 'children'>
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ProfilerWrapper id={id} {...options}>
      <Component {...props} />
    </ProfilerWrapper>
  );

  Wrapped.displayName = `withProfiler(${Component.displayName || Component.name || 'Component'})`;

  return Wrapped;
}

/**
 * Utility to measure execution time of any function
 *
 * @example
 * ```tsx
 * const { result, duration } = measureTime(() => {
 *   return expensiveCalculation(data);
 * });
 *
 * if (duration > 100) {
 *   console.warn('Calculation took too long:', duration);
 * }
 * ```
 */
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Async version of measureTime
 */
export async function measureTimeAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}
