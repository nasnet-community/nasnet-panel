/**
 * DNS Benchmark - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 5
 *
 * Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018).
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { DnsBenchmarkDesktop } from './DnsBenchmark.Desktop';
import { DnsBenchmarkMobile } from './DnsBenchmark.Mobile';
import type { DnsBenchmarkProps } from './types';

/**
 * DNS Benchmark Component
 *
 * Tests all configured DNS servers and displays results sorted by response time.
 * Automatically adapts UI for mobile (<640px) and desktop (>=640px) viewports.
 *
 * @description Headless + Platform Presenters pattern for DNS performance testing
 *
 * @example
 * ```tsx
 * <DnsBenchmark
 *   deviceId="router-1"
 *   onSuccess={(result) => console.log('Benchmark complete', result)}
 *   onError={(error) => toast.error(error)}
 * />
 * ```
 */
function DnsBenchmarkComponent(props: DnsBenchmarkProps) {
  const platform = usePlatform();

  return platform === 'mobile' ?
      <DnsBenchmarkMobile {...props} />
    : <DnsBenchmarkDesktop {...props} />;
}

DnsBenchmarkComponent.displayName = 'DnsBenchmarkComponent';

export const DnsBenchmark = memo(DnsBenchmarkComponent);

DnsBenchmark.displayName = 'DnsBenchmark';
