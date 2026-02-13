/**
 * DNS Benchmark - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 5
 *
 * Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018).
 */

import { DnsBenchmarkDesktop } from './DnsBenchmark.Desktop';
import { DnsBenchmarkMobile } from './DnsBenchmark.Mobile';
import type { DnsBenchmarkProps } from './types';

// Hook to detect viewport width
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

/**
 * DNS Benchmark Component
 *
 * Tests all configured DNS servers and displays results sorted by response time.
 * Automatically adapts UI for mobile (<640px) and desktop (>=640px) viewports.
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
export function DnsBenchmark(props: DnsBenchmarkProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <DnsBenchmarkMobile {...props} />
  ) : (
    <DnsBenchmarkDesktop {...props} />
  );
}

// Add React import
import * as React from 'react';
