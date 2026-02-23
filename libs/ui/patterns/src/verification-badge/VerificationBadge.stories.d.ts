/**
 * Verification Badge Storybook Stories
 *
 * Demonstrates the VerificationBadge component and its variants.
 *
 * @module @nasnet/ui/patterns/verification-badge
 */
import { VerificationBadge } from './index';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Verification Badge displays the binary verification status for service features.
 *
 * **Verification Status:**
 * - **Verified (Green):** Binary signature valid, checksum matches
 * - **Failed (Red):** Signature invalid or checksum mismatch
 * - **Unknown (Gray):** Not yet verified or verification pending
 * - **Error (Red):** Verification process error
 *
 * **Features:**
 * - Four verification states with distinct visual styles
 * - Tooltip/sheet with hash, timestamp, and error details
 * - Re-verification action support
 * - Platform-responsive (mobile = bottom sheet, desktop = tooltip)
 * - WCAG AAA accessible
 *
 * @see ADR-018: Headless + Platform Presenters
 */
declare const meta: Meta<typeof VerificationBadge>;
export default meta;
type Story = StoryObj<typeof VerificationBadge>;
/**
 * Verified status - Green shield indicating valid signature and checksum.
 */
export declare const Verified: Story;
/**
 * Failed status - Red shield indicating signature/checksum failure.
 */
export declare const Failed: Story;
/**
 * Unknown status - Gray shield indicating not yet verified.
 */
export declare const Unknown: Story;
/**
 * Pending status - Amber clock indicating verification in progress.
 */
export declare const Pending: Story;
/**
 * Small size - Compact badge for dense layouts.
 */
export declare const SizeSmall: Story;
/**
 * Medium size - Default size for most use cases.
 */
export declare const SizeMedium: Story;
/**
 * Large size - Prominent badge for emphasis.
 */
export declare const SizeLarge: Story;
/**
 * Desktop variant - Compact badge with hover tooltip.
 */
export declare const Desktop: Story;
/**
 * Mobile variant - Full-width card with bottom sheet.
 */
export declare const Mobile: Story;
/**
 * With inline label - Shows status text next to icon (desktop only).
 */
export declare const WithLabel: Story;
/**
 * With timestamp - Shows "Verified X ago" in tooltip/sheet.
 */
export declare const WithTimestamp: Story;
/**
 * With hash preview - Shows short hash inline.
 */
export declare const WithHashPreview: Story;
/**
 * Re-verification - Interactive example showing re-verify action.
 */
export declare const Reverification: Story;
/**
 * Loading state - Badge during re-verification.
 */
export declare const Loading: Story;
/**
 * Null verification - Handles missing verification data gracefully.
 */
export declare const NullVerification: Story;
/**
 * Failed with details - Shows failed verification with full hash.
 */
export declare const FailedWithDetails: Story;
//# sourceMappingURL=VerificationBadge.stories.d.ts.map