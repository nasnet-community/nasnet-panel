/**
 * Confidence Tooltip Component
 *
 * Displays detection details, confidence percentage, and override action.
 * Used in both Tooltip (desktop) and Sheet (mobile) contexts.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import type { UseConfidenceIndicatorReturn } from './confidence-indicator.types';
export interface ConfidenceTooltipContentProps {
    /**
     * Computed state from the headless hook
     */
    state: UseConfidenceIndicatorReturn;
    /**
     * Callback when user clicks override/edit
     */
    onOverride?: () => void;
    /**
     * Callback to close the tooltip/sheet
     */
    onClose?: () => void;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Whether this is in a compact context (tooltip vs sheet)
     */
    compact?: boolean;
}
/**
 * Confidence Tooltip Content Component
 *
 * Renders the content shown inside tooltips and sheets.
 * Displays detection method, percentage, and override option.
 *
 * @example
 * ```tsx
 * <TooltipContent>
 *   <ConfidenceTooltipContent
 *     state={state}
 *     onOverride={() => {
 *       state.handleOverride();
 *       closeTooltip();
 *     }}
 *   />
 * </TooltipContent>
 * ```
 */
export declare function ConfidenceTooltipContent({ state, onOverride, onClose, className, compact, }: ConfidenceTooltipContentProps): import("react/jsx-runtime").JSX.Element;
/**
 * Compact version for tooltips (desktop hover)
 */
export declare function ConfidenceTooltipCompact({ state, onOverride, onClose, }: Omit<ConfidenceTooltipContentProps, 'compact' | 'className'>): import("react/jsx-runtime").JSX.Element;
/**
 * Full version for sheets/popovers (mobile tap)
 */
export declare function ConfidenceTooltipFull({ state, onOverride, onClose, }: Omit<ConfidenceTooltipContentProps, 'compact' | 'className'>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=confidence-tooltip.d.ts.map