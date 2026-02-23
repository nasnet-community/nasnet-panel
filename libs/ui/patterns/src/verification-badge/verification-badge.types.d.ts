/**
 * Verification Badge Types
 *
 * Type definitions for the VerificationBadge component and its hooks.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/verification-badge
 */
import type { BinaryVerification } from '@nasnet/api-client/generated';
/**
 * Verification status classification (UI-friendly version)
 * Maps GraphQL enum values to simpler component states
 */
export type VerificationStatus = 'verified' | 'failed' | 'pending' | 'unknown';
/**
 * Size variants for the verification badge
 */
export type VerificationBadgeSize = 'sm' | 'md' | 'lg';
/**
 * Variant for platform-specific or forced rendering
 */
export type VerificationBadgeVariant = 'auto' | 'mobile' | 'desktop';
/**
 * Configuration for the useVerificationBadge hook
 */
export interface UseVerificationBadgeConfig {
    /**
     * Verification data from GraphQL (BinaryVerification type)
     */
    verification: BinaryVerification | null | undefined;
    /**
     * Service instance ID for re-verification
     */
    instanceId: string;
    /**
     * Callback when verification status changes
     */
    onVerificationChange?: (status: VerificationStatus) => void;
    /**
     * Whether to show the timestamp
     * @default true
     */
    showTimestamp?: boolean;
    /**
     * Whether to show the hash preview
     * @default false
     */
    showHash?: boolean;
}
/**
 * Return value from the useVerificationBadge hook
 */
export interface UseVerificationBadgeReturn {
    /**
     * Current verification status
     */
    status: VerificationStatus;
    /**
     * Semantic color name for styling (success, destructive, warning, muted)
     */
    color: 'success' | 'destructive' | 'warning' | 'muted';
    /**
     * Icon component name from lucide-react
     */
    iconName: 'ShieldCheck' | 'ShieldX' | 'ShieldQuestion' | 'Clock';
    /**
     * Formatted timestamp (e.g., "Verified 2 hours ago")
     */
    timestamp: string | null;
    /**
     * Short hash preview (first 8 chars)
     */
    hashPreview: string | null;
    /**
     * Full hash for tooltip/sheet
     */
    fullHash: string | null;
    /**
     * Verification error message (if status === 'error')
     */
    errorMessage: string | null;
    /**
     * Whether re-verification is in progress
     */
    isReverifying: boolean;
    /**
     * Handler for re-verification action
     */
    handleReverify: () => Promise<void>;
    /**
     * Accessible ARIA label describing the verification state
     */
    ariaLabel: string;
    /**
     * Human-readable label for the status
     */
    statusLabel: string;
    /**
     * Whether to show timestamp in UI
     */
    showTimestamp: boolean;
    /**
     * Whether to show hash in UI
     */
    showHash: boolean;
}
/**
 * Props for the VerificationBadge component
 */
export interface VerificationBadgeProps extends UseVerificationBadgeConfig {
    /**
     * Size of the badge
     * @default 'md'
     */
    size?: VerificationBadgeSize;
    /**
     * Force a specific variant (overrides auto-detection)
     * @default 'auto'
     */
    variant?: VerificationBadgeVariant;
    /**
     * Whether to show the status label inline (desktop only)
     * @default false
     */
    showLabel?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Optional ID for the badge (used for aria-describedby)
     */
    id?: string;
}
/**
 * Props for platform-specific presenter components
 */
export interface VerificationBadgePresenterProps {
    /**
     * Computed state from the headless hook
     */
    state: UseVerificationBadgeReturn;
    /**
     * Size of the badge
     */
    size: VerificationBadgeSize;
    /**
     * Whether to show the status label inline
     */
    showLabel: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Optional ID for the badge
     */
    id?: string;
}
//# sourceMappingURL=verification-badge.types.d.ts.map