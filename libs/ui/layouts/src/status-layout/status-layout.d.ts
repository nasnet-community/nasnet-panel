import * as React from 'react';
/**
 * Status Layout Component
 *
 * Sticky status/alert banner for displaying temporary status messages.
 * Uses semantic colors to indicate success, warning, error, or info states.
 * Optionally sticky-positioned and dismissible.
 *
 * Features:
 * - Four semantic status states (success, warning, error, info)
 * - Optional sticky positioning
 * - Optional dismiss button with accessible label
 * - Smooth transitions and animations
 * - Semantic HTML (<section> element)
 * - Responsive padding (mobile/desktop)
 * - Uses semantic color tokens (never hardcoded colors)
 * - Full WCAG AAA accessibility support
 *
 * @example
 * ```tsx
 * <StatusLayout
 *   status="error"
 *   visible={isError}
 *   onDismiss={() => setIsError(false)}
 * >
 *   Configuration failed: Please check your settings and try again.
 * </StatusLayout>
 * ```
 *
 * @see {@link StatusLayoutProps} for prop interface
 */
/**
 * StatusLayout component props
 * @interface StatusLayoutProps
 */
export interface StatusLayoutProps {
    /** Content to display inside the status banner */
    children: React.ReactNode;
    /** Semantic status type determining color and context */
    status?: 'success' | 'warning' | 'error' | 'info';
    /** Control visibility of the status banner */
    visible?: boolean;
    /** Whether banner sticks to top of viewport (true) or scrolls (false) */
    sticky?: boolean;
    /** Optional custom className for root element */
    className?: string;
    /** Optional callback when dismiss button is clicked */
    onDismiss?: () => void;
}
/**
 * StatusLayout - Sticky status/alert banner
 */
declare const StatusLayout: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusLayoutProps & React.RefAttributes<HTMLElement>>>;
export { StatusLayout };
//# sourceMappingURL=status-layout.d.ts.map