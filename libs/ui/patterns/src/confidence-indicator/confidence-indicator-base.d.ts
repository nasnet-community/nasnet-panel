/**
 * Confidence Indicator Base Component
 *
 * Core visual component for confidence indicators.
 * Renders the icon and optional label with semantic design tokens.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { ConfidenceLevel, ConfidenceIndicatorSize, UseConfidenceIndicatorReturn } from './confidence-indicator.types';
/**
 * CVA variants for the confidence indicator container
 */
declare const confidenceIndicatorVariants: (props?: ({
    level?: "high" | "low" | "medium" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
    interactive?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ConfidenceIndicatorBaseProps extends VariantProps<typeof confidenceIndicatorVariants> {
    /**
     * Computed state from the headless hook
     */
    state: UseConfidenceIndicatorReturn;
    /**
     * Size of the indicator
     * @default 'md'
     */
    size?: ConfidenceIndicatorSize;
    /**
     * Whether the indicator is interactive (can be clicked/focused)
     */
    interactive?: boolean;
    /**
     * Whether to animate on initial render
     * @default true
     */
    animateOnMount?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Optional ID for accessibility
     */
    id?: string;
    /**
     * Click handler (for opening tooltip/details)
     */
    onClick?: () => void;
    /**
     * Keyboard handler
     */
    onKeyDown?: (event: React.KeyboardEvent) => void;
}
/**
 * Confidence Indicator Base Component
 *
 * Renders the visual indicator with icon and semantic colors.
 * Used by both mobile and desktop presenters.
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 95 });
 *
 * <ConfidenceIndicatorBase
 *   state={state}
 *   size="md"
 *   interactive
 *   onClick={() => setShowDetails(true)}
 * />
 * ```
 */
export declare const ConfidenceIndicatorBase: React.ForwardRefExoticComponent<ConfidenceIndicatorBaseProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Confidence Indicator Dot
 *
 * Compact dot-only variant for space-constrained contexts.
 * Shows just a colored dot without the icon.
 */
export declare function ConfidenceIndicatorDot({ level, size, className, }: {
    level: ConfidenceLevel;
    size?: ConfidenceIndicatorSize;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Confidence Level Label
 *
 * Displays the human-readable label for a confidence level.
 */
export declare function ConfidenceLevelLabel({ state, size, showPercentage, className, }: {
    state: UseConfidenceIndicatorReturn;
    size?: ConfidenceIndicatorSize;
    showPercentage?: boolean;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export { confidenceIndicatorVariants };
//# sourceMappingURL=confidence-indicator-base.d.ts.map