/**
 * Confidence Indicator Module
 *
 * Visual confidence level display for auto-detected values.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
export { ConfidenceIndicator } from './confidence-indicator';
export { ConfidenceIndicatorDesktop, ConfidenceIndicatorDesktopExtended } from './confidence-indicator-desktop';
export { ConfidenceIndicatorMobile, ConfidenceIndicatorMobileCompact } from './confidence-indicator-mobile';
export { ConfidenceIndicatorBase, ConfidenceIndicatorDot, ConfidenceLevelLabel, confidenceIndicatorVariants, } from './confidence-indicator-base';
export { ConfidenceTooltipContent, ConfidenceTooltipCompact, ConfidenceTooltipFull, } from './confidence-tooltip';
export { useConfidenceIndicator, CONFIDENCE_THRESHOLDS, LEVEL_COLORS, LEVEL_ICONS, LEVEL_LABELS, } from './use-confidence-indicator';
export type { ConfidenceLevel, ConfidenceIndicatorSize, ConfidenceIndicatorVariant, ConfidenceIndicatorProps, ConfidenceIndicatorPresenterProps, UseConfidenceIndicatorConfig, UseConfidenceIndicatorReturn, } from './confidence-indicator.types';
//# sourceMappingURL=index.d.ts.map