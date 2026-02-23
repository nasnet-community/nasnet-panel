/**
 * useVerificationBadge Hook
 *
 * Headless hook for verification badge logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/verification-badge
 */
import type { UseVerificationBadgeConfig, UseVerificationBadgeReturn } from './verification-badge.types';
/**
 * Status-to-color mapping using semantic design tokens
 */
export declare const STATUS_COLORS: {
    readonly verified: "success";
    readonly failed: "destructive";
    readonly pending: "warning";
    readonly unknown: "muted";
};
/**
 * Status-to-icon mapping for lucide-react icons
 */
export declare const STATUS_ICONS: {
    readonly verified: "ShieldCheck";
    readonly failed: "ShieldX";
    readonly pending: "Clock";
    readonly unknown: "ShieldQuestion";
};
/**
 * Human-readable labels for verification status
 */
export declare const STATUS_LABELS: {
    readonly verified: "Verified";
    readonly failed: "Verification failed";
    readonly pending: "Verifying...";
    readonly unknown: "Not verified";
};
/**
 * Headless hook for verification badge component.
 *
 * Encapsulates all logic for:
 * - Status calculation and color/icon selection
 * - Timestamp formatting
 * - Hash preview generation
 * - Re-verification handling
 * - ARIA label generation
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useVerificationBadge({
 *   verification: { status: 'verified', verifiedAt: '2026-02-13T10:00:00Z', sha256Hash: 'abc123...' },
 *   instanceId: 'inst_123',
 *   onVerificationChange: (status) => console.log('Status changed:', status),
 * });
 *
 * // state.status === 'verified'
 * // state.color === 'success'
 * // state.ariaLabel === 'Verified, Verified at 2026-02-13T10:00:00Z'
 * ```
 */
export declare function useVerificationBadge(config: UseVerificationBadgeConfig): UseVerificationBadgeReturn;
//# sourceMappingURL=use-verification-badge.d.ts.map