/**
 * Session Expiring Dialog Component
 *
 * Modal warning users their session will expire soon with option to extend.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * Features:
 * - Countdown timer with visual progress bar
 * - Three urgency levels: normal (blue), urgent (amber), critical (red)
 * - Extend session or logout options
 * - Modal cannot be dismissed by clicking outside or pressing Escape
 * - Screen reader announcement via ARIA live regions
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @example
 * ```tsx
 * <SessionExpiringDialog
 *   warningThreshold={300}
 *   onExtendSession={handleRefreshToken}
 *   onSessionExpired={() => navigate('/login')}
 * />
 * ```
 */
/**
 * Props for SessionExpiringDialog component
 * Controls countdown behavior and callbacks
 */
export interface SessionExpiringDialogProps {
    /**
     * Time in seconds before expiry to show the warning
     * @default 300 (5 minutes)
     */
    warningThreshold?: number;
    /**
     * Callback when user chooses to extend session
     */
    onExtendSession?: () => Promise<void>;
    /**
     * Callback when session expires or user logs out
     */
    onSessionExpired?: () => void;
    /**
     * Whether to auto-logout when countdown reaches zero
     * @default true
     */
    autoLogout?: boolean;
    /**
     * Additional CSS classes for the dialog
     */
    className?: string;
}
/**
 * Hook for session expiring state
 */
export declare function useSessionExpiring(warningThreshold?: number): {
    timeRemaining: number | null;
    isExpiring: boolean;
    isExpired: boolean;
    logout: () => void;
    isAuthenticated: boolean;
};
/**
 * Session Expiring Dialog
 *
 * Shows when session is about to expire with:
 * - Countdown timer (MM:SS format)
 * - Visual progress bar indicating urgency
 * - Option to extend session
 * - Option to logout
 *
 * Urgency levels:
 * - Normal (>1 minute): Blue clock icon
 * - Urgent (30-60 seconds): Amber icon
 * - Critical (<30 seconds): Red alert icon with pulse animation
 *
 * The dialog cannot be dismissed and takes focus until resolved.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SessionExpiringDialog
 *   onExtendSession={async () => {
 *     await refreshToken();
 *   }}
 * />
 *
 * // Custom warning threshold (2 minutes)
 * <SessionExpiringDialog
 *   warningThreshold={120}
 *   onExtendSession={handleExtend}
 *   onSessionExpired={() => navigate('/login')}
 * />
 * ```
 */
declare function SessionExpiringDialogComponent({ warningThreshold, onExtendSession, onSessionExpired, autoLogout, className, }: SessionExpiringDialogProps): import("react/jsx-runtime").JSX.Element | null;
export declare const SessionExpiringDialog: import("react").MemoExoticComponent<typeof SessionExpiringDialogComponent>;
export {};
//# sourceMappingURL=SessionExpiringDialog.d.ts.map