/**
 * History Panel - Platform-Aware Component
 *
 * Auto-detects platform and renders the appropriate presenter.
 * Follows the Headless + Platform Presenters pattern (ADR-018).
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
import React from 'react';
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
export declare const HistoryPanel: React.NamedExoticComponent<HistoryPanelProps>;
//# sourceMappingURL=HistoryPanel.d.ts.map