/**
 * Service Traffic Statistics GraphQL Documents
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * Provides GraphQL queries, mutations, subscriptions for:
 * - Real-time service traffic monitoring (total, upload, download)
 * - Historical traffic data with time-series graphs
 * - Per-device bandwidth breakdown (using mangle counters)
 * - Traffic quota management with automated enforcement
 */

import { gql } from '@apollo/client';

// =============================================================================
// GraphQL Documents
// =============================================================================

/**
 * Query service traffic statistics with historical data
 * Returns total traffic, current period usage, historical data points, and quota info
 */
export const GET_SERVICE_TRAFFIC_STATS = gql`
  query GetServiceTrafficStats($routerID: ID!, $instanceID: ID!, $historyHours: Int) {
    serviceTrafficStats(routerID: $routerID, instanceID: $instanceID, historyHours: $historyHours) {
      instanceID
      totalUploadBytes
      totalDownloadBytes
      currentPeriodUpload
      currentPeriodDownload
      lastUpdated
      history {
        timestamp
        uploadBytes
        downloadBytes
        totalBytes
      }
      deviceBreakdown {
        deviceID
        deviceName
        ipAddress
        macAddress
        uploadBytes
        downloadBytes
        totalBytes
        percentOfTotal
      }
      quota {
        id
        instanceID
        period
        limitBytes
        consumedBytes
        remainingBytes
        usagePercent
        limitReached
        warningThreshold
        warningTriggered
        action
        periodStartedAt
        periodEndsAt
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Query per-device traffic breakdown for a service instance
 * Returns detailed bandwidth consumption per connected device
 */
export const GET_SERVICE_DEVICE_BREAKDOWN = gql`
  query GetServiceDeviceBreakdown($routerID: ID!, $instanceID: ID!) {
    serviceDeviceBreakdown(routerID: $routerID, instanceID: $instanceID) {
      deviceID
      deviceName
      ipAddress
      macAddress
      uploadBytes
      downloadBytes
      totalBytes
      percentOfTotal
    }
  }
`;

/**
 * Mutation to set traffic quota for a service instance
 * Configures bandwidth limits with automated warnings and enforcement
 */
export const SET_TRAFFIC_QUOTA = gql`
  mutation SetTrafficQuota($input: SetTrafficQuotaInput!) {
    setTrafficQuota(input: $input) {
      errors {
        field
        message
      }
      quota {
        id
        instanceID
        period
        limitBytes
        consumedBytes
        remainingBytes
        usagePercent
        limitReached
        warningThreshold
        warningTriggered
        action
        periodStartedAt
        periodEndsAt
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Mutation to reset/remove traffic quota for a service instance
 * Removes all quota restrictions and resets counters
 */
export const RESET_TRAFFIC_QUOTA = gql`
  mutation ResetTrafficQuota($routerID: ID!, $instanceID: ID!) {
    resetTrafficQuota(routerID: $routerID, instanceID: $instanceID) {
      errors {
        field
        message
      }
      quota {
        id
        instanceID
        period
        limitBytes
        consumedBytes
        remainingBytes
      }
    }
  }
`;

/**
 * Subscribe to real-time traffic statistics updates
 * Receives periodic updates when traffic counters change
 */
export const SUBSCRIBE_SERVICE_TRAFFIC_UPDATED = gql`
  subscription ServiceTrafficUpdated($routerID: ID!, $instanceID: ID!) {
    serviceTrafficUpdated(routerID: $routerID, instanceID: $instanceID) {
      instanceID
      totalUploadBytes
      totalDownloadBytes
      currentPeriodUpload
      currentPeriodDownload
      lastUpdated
      history {
        timestamp
        uploadBytes
        downloadBytes
        totalBytes
      }
      deviceBreakdown {
        deviceID
        deviceName
        ipAddress
        macAddress
        uploadBytes
        downloadBytes
        totalBytes
        percentOfTotal
      }
      quota {
        id
        instanceID
        period
        limitBytes
        consumedBytes
        remainingBytes
        usagePercent
        limitReached
        warningThreshold
        warningTriggered
        action
        periodStartedAt
        periodEndsAt
      }
    }
  }
`;
