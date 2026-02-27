/**
 * Confidence Indicator Module
 *
 * Visual confidence level display for auto-detected values.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

// Main component
export { ConfidenceIndicator } from './confidence-indicator';

// Platform presenters
export {
  ConfidenceIndicatorDesktop,
  ConfidenceIndicatorDesktopExtended,
} from './confidence-indicator-desktop';
export {
  ConfidenceIndicatorMobile,
  ConfidenceIndicatorMobileCompact,
} from './confidence-indicator-mobile';

// Base components
export {
  ConfidenceIndicatorBase,
  ConfidenceIndicatorDot,
  ConfidenceLevelLabel,
  confidenceIndicatorVariants,
} from './confidence-indicator-base';

// Tooltip components
export {
  ConfidenceTooltipContent,
  ConfidenceTooltipCompact,
  ConfidenceTooltipFull,
} from './confidence-tooltip';

// Headless hook
export {
  useConfidenceIndicator,
  CONFIDENCE_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_LABELS,
} from './use-confidence-indicator';

// Types
export type {
  ConfidenceLevel,
  ConfidenceIndicatorSize,
  ConfidenceIndicatorVariant,
  ConfidenceIndicatorProps,
  ConfidenceIndicatorPresenterProps,
  UseConfidenceIndicatorConfig,
  UseConfidenceIndicatorReturn,
} from './confidence-indicator.types';
