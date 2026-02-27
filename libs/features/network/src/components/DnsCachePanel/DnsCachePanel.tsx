/**
 * DNS Cache Panel - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 6
 *
 * @description Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018) with automatic platform detection.
 */

import * as React from 'react';
import { DnsCachePanelDesktop } from './DnsCachePanel.Desktop';
import { DnsCachePanelMobile } from './DnsCachePanel.Mobile';
import type { DnsCachePanelProps } from './types';

const MOBILE_BREAKPOINT_MAX = 639;

/**
 * Hook to detect if viewport is mobile (<640px)
 *
 * Uses media query listener for reactive viewport detection.
 * Initializes with current viewport size to avoid hydration mismatch.
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_MAX}px)`);

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
 * DNS Cache Panel Component
 *
 * @description Displays DNS cache statistics (entries, size, hit rate, top domains) and
 * provides cache flush functionality with before/after preview.
 * Automatically adapts UI for mobile (<640px) and desktop (>=640px) viewports.
 *
 * @example
 * ```tsx
 * import { DnsCachePanel } from '@nasnet/features/network';
 * import { useToast } from '@nasnet/ui/primitives/use-toast';
 *
 * function DnsPage() {
 *   const { toast } = useToast();
 *
 *   return (
 *     <DnsCachePanel
 *       deviceId="router-1"
 *       onFlushSuccess={(result) => toast({
 *         title: 'Cache flushed',
 *         description: `Removed ${result.entriesRemoved} entries`,
 *       })}
 *       onFlushError={(error) => toast({
 *         title: 'Failed to flush cache',
 *         description: error,
 *         variant: 'destructive',
 *       })}
 *     />
 *   );
 * }
 * ```
 *
 * @see DnsCachePanelDesktop Desktop presenter layout
 * @see DnsCachePanelMobile Mobile presenter layout
 */
export function DnsCachePanel(props: DnsCachePanelProps) {
  const isMobile = useIsMobile();

  return isMobile ? <DnsCachePanelMobile {...props} /> : <DnsCachePanelDesktop {...props} />;
}

DnsCachePanel.displayName = 'DnsCachePanel';
