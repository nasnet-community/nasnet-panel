/**
 * History Panel - Platform-Aware Component
 *
 * Auto-detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern (ADR-018).
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { HistoryPanelDesktop } from './HistoryPanelDesktop';
import { HistoryPanelMobile } from './HistoryPanelMobile';

import type { HistoryPanelProps } from './types';

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
export const HistoryPanel = React.memo(function HistoryPanel(props: HistoryPanelProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return <HistoryPanelMobile {...props} />;
  }

  return <HistoryPanelDesktop {...props} />;
});

HistoryPanel.displayName = 'HistoryPanel';
