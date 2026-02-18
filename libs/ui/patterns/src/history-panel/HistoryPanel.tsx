/**
 * History Panel - Platform-Aware Component
 *
 * Auto-detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern (ADR-018).
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import React from 'react';

import { HistoryPanelDesktop } from './HistoryPanelDesktop';
import { HistoryPanelMobile } from './HistoryPanelMobile';

import type { HistoryPanelProps } from './types';

/**
 * Hook to detect if we're on a mobile device
 * Based on viewport width (matches Tailwind sm breakpoint)
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * History Panel Component
 *
 * Platform-aware component that renders the appropriate
 * presenter based on device type.
 *
 * - Desktop (>640px): Full panel with keyboard navigation
 * - Mobile (<640px): Bottom sheet with large touch targets
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showHistory, setShowHistory] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setShowHistory(true)}>
 *         Show History
 *       </Button>
 *
 *       {showHistory && (
 *         <HistoryPanel onClose={() => setShowHistory(false)} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function HistoryPanel(props: HistoryPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <HistoryPanelMobile {...props} />;
  }

  return <HistoryPanelDesktop {...props} />;
}
