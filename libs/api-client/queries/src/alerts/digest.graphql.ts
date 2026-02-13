import { gql } from '@apollo/client';

/**
 * GraphQL documents for email digest functionality
 * NAS-18.11: Alert Digest Mode
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get the number of alerts queued for digest delivery
 */
export const GET_DIGEST_QUEUE_COUNT = gql`
  query GetDigestQueueCount($channelId: ID!) {
    digestQueueCount(channelId: $channelId)
  }
`;

/**
 * Get digest delivery history for a channel
 */
export const GET_DIGEST_HISTORY = gql`
  query GetDigestHistory($channelId: ID!, $limit: Int) {
    digestHistory(channelId: $channelId, limit: $limit) {
      id
      channelId
      deliveredAt
      alertCount
      period
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Trigger immediate digest delivery for a channel
 */
export const TRIGGER_DIGEST_NOW = gql`
  mutation TriggerDigestNow($channelId: ID!) {
    triggerDigestNow(channelId: $channelId) {
      id
      channelId
      deliveredAt
      alertCount
      period
    }
  }
`;
