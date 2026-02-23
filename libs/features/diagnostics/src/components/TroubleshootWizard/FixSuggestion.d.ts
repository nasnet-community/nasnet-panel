import type { FixSuggestion as FixSuggestionType, ISPInfo } from '../../types/troubleshoot.types';
interface FixSuggestionProps {
    /** The fix suggestion to display with confidence level and actionable remediation */
    fix: FixSuggestionType;
    /** Current fix application state: idle (ready), applying (in progress), applied (success), failed (error) */
    status: 'idle' | 'applying' | 'applied' | 'failed';
    /** Callback when user clicks Apply Fix button */
    onApply: () => void;
    /** Callback when user clicks Skip or Continue button */
    onSkip: () => void;
    /** Whether to show detailed RouterOS command preview for manual review */
    showCommandPreview?: boolean;
    /** ISP contact information for "Contact ISP" fix suggestions */
    ispInfo?: ISPInfo;
}
/**
 * Displays a diagnostic fix suggestion with confidence level, manual steps, and action buttons.
 * Supports both automatic fixes (with Apply button) and manual fixes (with manual steps).
 * Includes ISP contact information when applicable for internet connectivity issues.
 *
 * @example
 * ```tsx
 * <FixSuggestion
 *   fix={suggestion}
 *   status={fixStatus}
 *   onApply={() => applyFix(suggestion)}
 *   onSkip={() => skipFix()}
 *   showCommandPreview
 * />
 * ```
 */
export declare const FixSuggestion: import("react").NamedExoticComponent<FixSuggestionProps>;
export {};
//# sourceMappingURL=FixSuggestion.d.ts.map