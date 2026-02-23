/**
 * useConfidenceIndicator Hook
 *
 * Headless hook for confidence indicator logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import type { UseConfidenceIndicatorConfig, UseConfidenceIndicatorReturn } from './confidence-indicator.types';
/**
 * Confidence level thresholds
 * - >= 90: high confidence (green)
 * - >= 60: medium confidence (amber)
 * - < 60: low confidence (red)
 */
declare const CONFIDENCE_THRESHOLDS: {
    readonly HIGH: 90;
    readonly MEDIUM: 60;
};
/**
 * Level-to-color mapping using semantic design tokens
 */
declare const LEVEL_COLORS: {
    readonly high: "success";
    readonly medium: "warning";
    readonly low: "error";
};
/**
 * Level-to-icon mapping for lucide-react icons
 */
declare const LEVEL_ICONS: {
    readonly high: "CheckCircle2";
    readonly medium: "AlertTriangle";
    readonly low: "XCircle";
};
/**
 * Human-readable labels for confidence levels
 */
declare const LEVEL_LABELS: {
    readonly high: "High confidence";
    readonly medium: "Medium confidence";
    readonly low: "Low confidence";
};
/**
 * Headless hook for confidence indicator component.
 *
 * Encapsulates all logic for:
 * - Confidence level calculation
 * - Color and icon selection
 * - ARIA label generation
 * - Override action handling
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({
 *   confidence: 95,
 *   method: 'Auto-detected via DHCP response',
 *   onOverride: () => setIsEditing(true),
 * });
 *
 * // state.level === 'high'
 * // state.color === 'success'
 * // state.ariaLabel === 'High confidence, 95%, Auto-detected via DHCP response'
 * ```
 */
export declare function useConfidenceIndicator(config: UseConfidenceIndicatorConfig): UseConfidenceIndicatorReturn;
/**
 * Export level constants for testing and documentation
 */
export { CONFIDENCE_THRESHOLDS, LEVEL_COLORS, LEVEL_ICONS, LEVEL_LABELS };
//# sourceMappingURL=use-confidence-indicator.d.ts.map