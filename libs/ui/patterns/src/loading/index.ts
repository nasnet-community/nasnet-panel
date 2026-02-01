/**
 * Loading Pattern Components
 *
 * Pattern-level components for loading states, progress indicators,
 * and data freshness indicators.
 *
 * @module @nasnet/ui/patterns/loading
 */

// LoadingOverlay - Full container/screen loading overlay
export { LoadingOverlay } from './LoadingOverlay';
export type { LoadingOverlayProps } from './LoadingOverlay';

// LoadingSpinner - Standalone spinner with label
export { LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

// ProgressBar - Progress indicator for long operations
export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

// StaleDataBadge - Badge for stale/cached data
export { StaleDataBadge } from './StaleDataBadge';
export type { StaleDataBadgeProps } from './StaleDataBadge';

// RefreshIndicator - Subtle top-bar refresh indicator
export { RefreshIndicator } from './RefreshIndicator';
export type { RefreshIndicatorProps } from './RefreshIndicator';

// QueryLoadingState - Unified query state handler
export { QueryLoadingState } from './QueryLoadingState';
export type { QueryLoadingStateProps } from './QueryLoadingState';
