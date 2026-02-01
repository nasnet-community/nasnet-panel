/**
 * History Panel Exports
 *
 * Provides the history panel component with platform-specific presenters.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

// Main component (auto-detects platform)
export { HistoryPanel } from './HistoryPanel';

// Platform-specific presenters
export { HistoryPanelDesktop } from './HistoryPanelDesktop';
export { HistoryPanelMobile } from './HistoryPanelMobile';

// Headless hook
export {
  useHistoryPanel,
  formatHistoryTimestamp,
  getActionTypeIcon,
} from './useHistoryPanel';
export type {
  HistoryPanelItem,
  UseHistoryPanelOptions,
  UseHistoryPanelReturn,
} from './useHistoryPanel';

// Types
export type { HistoryPanelProps } from './types';
