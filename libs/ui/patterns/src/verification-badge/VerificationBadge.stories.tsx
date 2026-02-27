/**
 * Verification Badge Storybook Stories
 *
 * Demonstrates the VerificationBadge component and its variants.
 *
 * @module @nasnet/ui/patterns/verification-badge
 */

import { fn } from 'storybook/test';

import { VerificationStatus as GraphQLStatus } from '@nasnet/api-client/generated';
import type { BinaryVerification } from '@nasnet/api-client/generated';

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
const meta: Meta<typeof VerificationBadge> = {
  title: 'Patterns/VerificationBadge',
  component: VerificationBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A visual verification status display for service binaries. Shows verified (green), failed (red), unknown (gray), or error (red) with detailed information.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    variant: {
      control: 'select',
      options: ['auto', 'mobile', 'desktop'],
      description: 'Force a specific variant',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show inline label (desktop only)',
    },
    showTimestamp: {
      control: 'boolean',
      description: 'Show verification timestamp',
    },
    showHash: {
      control: 'boolean',
      description: 'Show hash preview',
    },
    onVerificationChange: {
      action: 'verification-change',
      description: 'Callback when verification status changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VerificationBadge>;

// ============================================================================
// Mock Verification Data
// ============================================================================

const verifiedData: BinaryVerification = {
  enabled: true,
  status: GraphQLStatus.Valid,
  verifiedAt: '2026-02-13T08:30:00Z',
  binaryHash: 'abc123def456789012345678901234567890123456789012345678901234',
  archiveHash: 'def456abc789',
  gpgVerified: true,
  gpgKeyID: 'KEY123',
  checksumsURL: 'https://example.com/checksums.txt',
};

const failedData: BinaryVerification = {
  enabled: true,
  status: GraphQLStatus.Invalid,
  verifiedAt: '2026-02-13T08:30:00Z',
  binaryHash: 'abc123def456789012345678901234567890123456789012345678901234',
  archiveHash: 'def456abc789',
  gpgVerified: false,
  gpgKeyID: null,
  checksumsURL: 'https://example.com/checksums.txt',
};

const unknownData: BinaryVerification = {
  enabled: false,
  status: GraphQLStatus.NotVerified,
  verifiedAt: null,
  binaryHash: null,
  archiveHash: null,
  gpgVerified: false,
  gpgKeyID: null,
  checksumsURL: null,
};

const pendingData: BinaryVerification = {
  enabled: true,
  status: GraphQLStatus.Pending,
  verifiedAt: null,
  binaryHash: null,
  archiveHash: null,
  gpgVerified: false,
  gpgKeyID: null,
  checksumsURL: 'https://example.com/checksums.txt',
};

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Verified status - Green shield indicating valid signature and checksum.
 */
export const Verified: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_verified_123',
    showTimestamp: true,
    showHash: false,
    size: 'md',
    variant: 'desktop',
    onVerificationChange: fn(),
  },
};

/**
 * Failed status - Red shield indicating signature/checksum failure.
 */
export const Failed: Story = {
  args: {
    verification: failedData,
    instanceId: 'inst_failed_123',
    showTimestamp: true,
    showHash: false,
    size: 'md',
    variant: 'desktop',
    onVerificationChange: fn(),
  },
};

/**
 * Unknown status - Gray shield indicating not yet verified.
 */
export const Unknown: Story = {
  args: {
    verification: unknownData,
    instanceId: 'inst_unknown_123',
    showTimestamp: false,
    showHash: false,
    size: 'md',
    variant: 'desktop',
    onVerificationChange: fn(),
  },
};

/**
 * Pending status - Amber clock indicating verification in progress.
 */
export const Pending: Story = {
  args: {
    verification: pendingData,
    instanceId: 'inst_pending_123',
    showTimestamp: false,
    showHash: false,
    size: 'md',
    variant: 'desktop',
    onVerificationChange: fn(),
  },
};

// ============================================================================
// Size Variants
// ============================================================================

/**
 * Small size - Compact badge for dense layouts.
 */
export const SizeSmall: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_sm_123',
    size: 'sm',
    variant: 'desktop',
  },
};

/**
 * Medium size - Default size for most use cases.
 */
export const SizeMedium: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_md_123',
    size: 'md',
    variant: 'desktop',
  },
};

/**
 * Large size - Prominent badge for emphasis.
 */
export const SizeLarge: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_lg_123',
    size: 'lg',
    variant: 'desktop',
  },
};

// ============================================================================
// Platform Variants
// ============================================================================

/**
 * Desktop variant - Compact badge with hover tooltip.
 */
export const Desktop: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_desktop_123',
    showTimestamp: true,
    showHash: true,
    size: 'md',
    variant: 'desktop',
  },
};

/**
 * Mobile variant - Full-width card with bottom sheet.
 */
export const Mobile: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_mobile_123',
    showTimestamp: true,
    showHash: true,
    size: 'md',
    variant: 'mobile',
  },
};

// ============================================================================
// Display Options
// ============================================================================

/**
 * With inline label - Shows status text next to icon (desktop only).
 */
export const WithLabel: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_label_123',
    showLabel: true,
    size: 'md',
    variant: 'desktop',
  },
};

/**
 * With timestamp - Shows "Verified X ago" in tooltip/sheet.
 */
export const WithTimestamp: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_timestamp_123',
    showTimestamp: true,
    size: 'md',
    variant: 'desktop',
  },
};

/**
 * With hash preview - Shows short hash inline.
 */
export const WithHashPreview: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_hash_123',
    showHash: true,
    size: 'md',
    variant: 'desktop',
  },
};

// ============================================================================
// Interactive Stories
// ============================================================================

/**
 * Re-verification - Interactive example showing re-verify action.
 */
export const Reverification: Story = {
  args: {
    verification: verifiedData,
    instanceId: 'inst_reverify_123',
    showTimestamp: true,
    size: 'md',
    variant: 'desktop',
    onVerificationChange: fn(),
  },
};

/**
 * Loading state - Badge during re-verification.
 */
export const Loading: Story = {
  args: {
    verification: unknownData,
    instanceId: 'inst_loading_123',
    size: 'md',
    variant: 'desktop',
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

/**
 * Null verification - Handles missing verification data gracefully.
 */
export const NullVerification: Story = {
  args: {
    verification: null,
    instanceId: 'inst_null_123',
    size: 'md',
    variant: 'desktop',
  },
};

/**
 * Failed with details - Shows failed verification with full hash.
 */
export const FailedWithDetails: Story = {
  args: {
    verification: {
      ...failedData,
      binaryHash: 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      archiveHash: 'cafebabe1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    instanceId: 'inst_failed_details_123',
    showTimestamp: true,
    showHash: true,
    size: 'md',
    variant: 'desktop',
  },
};
