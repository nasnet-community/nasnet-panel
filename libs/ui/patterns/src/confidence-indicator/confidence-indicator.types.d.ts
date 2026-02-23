/**
 * Confidence Indicator Types
 *
 * Type definitions for the ConfidenceIndicator component and its hooks.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */
/**
 * Confidence level classification
 * - high: 90%+ confidence - solid checkmark, strong visual signal
 * - medium: 60-89% confidence - caution indicator, moderate signal
 * - low: <60% confidence - warning indicator, suggests manual verification
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';
/**
 * Size variants for the confidence indicator
 */
export type ConfidenceIndicatorSize = 'sm' | 'md' | 'lg';
/**
 * Variant for platform-specific or forced rendering
 */
export type ConfidenceIndicatorVariant = 'auto' | 'mobile' | 'desktop';
/**
 * Configuration for the useConfidenceIndicator hook
 */
export interface UseConfidenceIndicatorConfig {
    /**
     * Confidence percentage (0-100)
     */
    confidence: number;
    /**
     * Detection method description (e.g., "Auto-detected via ARP scan")
     */
    method?: string;
    /**
     * Callback when user wants to override the detected value
     */
    onOverride?: () => void;
    /**
     * Whether to show the percentage in the UI
     * @default true
     */
    showPercentage?: boolean;
}
/**
 * Return value from the useConfidenceIndicator hook
 */
export interface UseConfidenceIndicatorReturn {
    /**
     * Calculated confidence level based on percentage thresholds
     */
    level: ConfidenceLevel;
    /**
     * Semantic color name for styling (success, warning, error)
     */
    color: 'success' | 'warning' | 'error';
    /**
     * Icon component name from lucide-react
     */
    iconName: 'CheckCircle2' | 'AlertTriangle' | 'XCircle';
    /**
     * Confidence percentage (0-100)
     */
    percentage: number;
    /**
     * Detection method description
     */
    method: string | undefined;
    /**
     * Whether the override action is available
     */
    canOverride: boolean;
    /**
     * Handler for the override action
     */
    handleOverride: () => void;
    /**
     * Accessible ARIA label describing the confidence state
     */
    ariaLabel: string;
    /**
     * Human-readable label for the confidence level
     */
    levelLabel: string;
    /**
     * Whether to show the percentage
     */
    showPercentage: boolean;
}
/**
 * Props for the ConfidenceIndicator component
 */
export interface ConfidenceIndicatorProps extends UseConfidenceIndicatorConfig {
    /**
     * Size of the indicator
     * @default 'md'
     */
    size?: ConfidenceIndicatorSize;
    /**
     * Force a specific variant (overrides auto-detection)
     * @default 'auto'
     */
    variant?: ConfidenceIndicatorVariant;
    /**
     * Whether to show the label text inline (desktop only)
     * @default false
     */
    showLabel?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Optional ID for the indicator (used for aria-describedby)
     */
    id?: string;
}
/**
 * Props for platform-specific presenter components
 */
export interface ConfidenceIndicatorPresenterProps {
    /**
     * Computed state from the headless hook
     */
    state: UseConfidenceIndicatorReturn;
    /**
     * Size of the indicator
     */
    size: ConfidenceIndicatorSize;
    /**
     * Whether to show the label text inline
     */
    showLabel: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Optional ID for the indicator
     */
    id?: string;
}
//# sourceMappingURL=confidence-indicator.types.d.ts.map