/**
 * DNS Cache Panel - Auto-Detecting Wrapper
 * NAS-6.12: DNS Cache & Diagnostics - Task 6
 *
 * Automatically selects Mobile or Desktop presenter based on viewport width.
 * Follows Headless + Platform Presenters pattern (ADR-018).
 */

import * as React from 'react';
import { DnsCachePanelDesktop } from './DnsCachePanel.Desktop';
import { DnsCachePanelMobile } from './DnsCachePanel.Mobile';
import type { DnsCachePanelProps } from './types';

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
 * DNS Cache Panel Component
 *
 * Displays DNS cache statistics (entries, size, hit rate, top domains) and
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
 */
export function DnsCachePanel(props: DnsCachePanelProps) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <DnsCachePanelMobile {...props} />
  ) : (
    <DnsCachePanelDesktop {...props} />
  );
}
