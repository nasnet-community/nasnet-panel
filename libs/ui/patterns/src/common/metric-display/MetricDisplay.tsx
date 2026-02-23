/**
 * MetricDisplay Component
 *
 * Auto-detecting wrapper that renders the appropriate presenter
 * based on the current platform (mobile/desktop).
 *
 * @see ADR-018 for Headless + Presenter architecture
 *
 * @example
 * ```tsx
 * import { MetricDisplay } from '@nasnet/ui/patterns';
 * import { Cpu } from 'lucide-react';
 *
 * // Basic usage
 * <MetricDisplay
 *   label="CPU Usage"
 *   value={85}
 *   unit="%"
 * />
 *
 * // With trend and icon
 * <MetricDisplay
 *   label="Memory"
 *   value={512}
 *   unit="MB"
 *   icon={Cpu}
 *   variant="warning"
 *   trend="up"
 *   trendValue="+15%"
 *   onClick={() => navigate('/system/memory')}
 * />
 *
 * // Loading state
 * <MetricDisplay
 *   label="Network Traffic"
 *   value={0}
 *   isLoading
 * />
 * ```
 */

import { memo, useMemo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { MetricDisplayDesktop } from './MetricDisplay.Desktop';
import { MetricDisplayMobile } from './MetricDisplay.Mobile';
import { MetricDisplayTablet } from './MetricDisplay.Tablet';

import type { MetricDisplayProps } from './types';

/**
 * MetricDisplay - Platform-adaptive metric display
 *
 * Displays a key metric with label, value, optional unit, trend, and icon.
 * Automatically selects the appropriate presenter based on device.
 *
 * Supports manual presenter override via the `presenter` prop for testing
 * or special layout scenarios (not recommended for production).
 *
 * Use cases:
 * - Dashboard KPIs (CPU, memory, bandwidth)
 * - Statistics cards
 * - Counter displays
 * - Performance metrics
 */
function MetricDisplayComponent(props: MetricDisplayProps) {
  const platform = usePlatform();
  const { presenter: presenterOverride } = props;

  // Memoize presenter selection to prevent unnecessary re-renders
  const Presenter = useMemo(() => {
    // Manual override takes precedence over auto-detection
    const activePresenter = presenterOverride || platform;

    switch (activePresenter) {
      case 'mobile':
        return MetricDisplayMobile;
      case 'tablet':
        return MetricDisplayTablet;
      case 'desktop':
        return MetricDisplayDesktop;
      default:
        return MetricDisplayDesktop;
    }
  }, [platform, presenterOverride]);

  return <Presenter {...props} />;
}

MetricDisplayComponent.displayName = 'MetricDisplay';

export const MetricDisplay = memo(MetricDisplayComponent);
