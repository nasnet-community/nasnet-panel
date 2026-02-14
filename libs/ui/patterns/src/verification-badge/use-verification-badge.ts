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

import { useMemo, useCallback } from 'react';
import { VerificationStatus as GraphQLStatus } from '@nasnet/api-client/generated';
import { useReverifyFeature } from '@nasnet/api-client/queries';

import type {
  UseVerificationBadgeConfig,
  UseVerificationBadgeReturn,
  VerificationStatus,
} from './verification-badge.types';

/**
 * Status-to-color mapping using semantic design tokens
 */
export const STATUS_COLORS = {
  verified: 'success',
  failed: 'destructive',
  pending: 'warning',
  unknown: 'muted',
} as const;

/**
 * Status-to-icon mapping for lucide-react icons
 */
export const STATUS_ICONS = {
  verified: 'ShieldCheck',
  failed: 'ShieldX',
  pending: 'Clock',
  unknown: 'ShieldQuestion',
} as const;

/**
 * Human-readable labels for verification status
 */
export const STATUS_LABELS = {
  verified: 'Verified',
  failed: 'Verification failed',
  pending: 'Verifying...',
  unknown: 'Not verified',
} as const;

/**
 * Map GraphQL VerificationStatus enum to UI-friendly status
 */
function mapGraphQLStatus(graphqlStatus: typeof GraphQLStatus[keyof typeof GraphQLStatus] | undefined): VerificationStatus {
  switch (graphqlStatus) {
    case GraphQLStatus.Valid:
      return 'verified';
    case GraphQLStatus.Invalid:
      return 'failed';
    case GraphQLStatus.Pending:
      return 'pending';
    case GraphQLStatus.NotVerified:
    default:
      return 'unknown';
  }
}

/**
 * Format timestamp relative to now (e.g., "Verified 2 hours ago")
 * TODO: Implement actual relative time formatting
 */
function formatTimestamp(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;

  // Placeholder implementation - will use date-fns or similar
  return `Verified at ${timestamp}`;
}

/**
 * Extract short hash preview (first 8 characters)
 */
function extractHashPreview(hash: string | null | undefined): string | null {
  if (!hash) return null;
  return hash.substring(0, 8);
}

/**
 * Extract router ID from instance ID
 * Instance IDs are typically in format "routerID:featureID:instanceName"
 */
function extractRouterID(instanceId: string): string {
  const parts = instanceId.split(':');
  return parts[0] || instanceId;
}

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
export function useVerificationBadge(
  config: UseVerificationBadgeConfig
): UseVerificationBadgeReturn {
  const {
    verification,
    instanceId,
    onVerificationChange,
    showTimestamp = true,
    showHash = false,
  } = config;

  // Extract router ID from instance ID
  const routerID = useMemo(() => extractRouterID(instanceId), [instanceId]);

  // Connect to reverification mutation
  const [reverifyMutation, { loading: isReverifying }] = useReverifyFeature();

  // Map GraphQL status to UI status
  const status: VerificationStatus = useMemo(
    () => mapGraphQLStatus(verification?.status),
    [verification?.status]
  );

  // Get semantic color for the status
  const color = STATUS_COLORS[status];

  // Get icon name for the status
  const iconName = STATUS_ICONS[status];

  // Get human-readable label
  const statusLabel = STATUS_LABELS[status];

  // Format timestamp
  const timestamp = useMemo(
    () => formatTimestamp(verification?.verifiedAt),
    [verification?.verifiedAt]
  );

  // Extract hash preview and full hash (use binaryHash, fallback to archiveHash)
  const fullHash = verification?.binaryHash ?? verification?.archiveHash ?? null;
  const hashPreview = useMemo(
    () => extractHashPreview(fullHash),
    [fullHash]
  );

  // No explicit error message in BinaryVerification - derive from status
  const errorMessage = status === 'failed' ? 'Binary hash mismatch detected' : null;

  // Handler for re-verification
  const handleReverify = useCallback(async () => {
    try {
      const result = await reverifyMutation({
        variables: { routerID, instanceID: instanceId },
      });

      if (result.data?.reverifyInstance.success) {
        onVerificationChange?.('verified');
      } else {
        onVerificationChange?.('failed');
      }
    } catch (error) {
      console.error('Reverification failed:', error);
      onVerificationChange?.('unknown');
    }
  }, [routerID, instanceId, reverifyMutation, onVerificationChange]);

  // Build accessible ARIA label
  const ariaLabel = useMemo(() => {
    const parts: string[] = [statusLabel];

    if (timestamp && showTimestamp) {
      parts.push(timestamp);
    }

    if (errorMessage) {
      parts.push(errorMessage);
    }

    return parts.join(', ');
  }, [statusLabel, timestamp, showTimestamp, errorMessage]);

  return {
    status,
    color,
    iconName,
    timestamp,
    hashPreview,
    fullHash,
    errorMessage,
    isReverifying,
    handleReverify,
    ariaLabel,
    statusLabel,
    showTimestamp,
    showHash,
  };
}

// Constants already exported above - no need to re-export
