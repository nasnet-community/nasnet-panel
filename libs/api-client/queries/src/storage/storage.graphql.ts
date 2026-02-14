import { gql } from '@apollo/client';

/**
 * GraphQL documents for External Storage Management
 * NAS-8.20: USB/disk storage for service binaries and data
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * List all detected storage locations (flash and external).
 * Scans known RouterOS mount points and returns availability.
 */
export const GET_STORAGE_INFO = gql`
  query GetStorageInfo {
    storageInfo {
      path
      totalBytes
      availableBytes
      usedBytes
      filesystem
      mounted
      usagePercent
      locationType
    }
  }
`;

/**
 * Get comprehensive storage usage breakdown.
 * Shows flash vs external usage and per-feature breakdown.
 */
export const GET_STORAGE_USAGE = gql`
  query GetStorageUsage($routerId: ID) {
    storageUsage(routerId: $routerId) {
      flash {
        totalBytes
        usedBytes
        availableBytes
        contents
        usagePercent
        locationType
        thresholdStatus
      }
      external {
        totalBytes
        usedBytes
        availableBytes
        contents
        usagePercent
        locationType
        thresholdStatus
      }
      features {
        featureId
        featureName
        binarySize
        dataSize
        configSize
        logsSize
        totalSize
        location
        instanceCount
      }
      totalUsedBytes
      totalCapacityBytes
      calculatedAt
    }
  }
`;

/**
 * Get current external storage configuration.
 * Returns enabled state and configured path.
 */
export const GET_STORAGE_CONFIG = gql`
  query GetStorageConfig {
    storageConfig {
      enabled
      path
      storageInfo {
        path
        totalBytes
        availableBytes
        usedBytes
        filesystem
        mounted
        usagePercent
        locationType
      }
      updatedAt
      isAvailable
    }
  }
`;

/**
 * Get list of features affected by storage disconnection.
 * Returns features marked as unavailable due to missing storage.
 */
export const GET_UNAVAILABLE_FEATURES = gql`
  query GetUnavailableFeatures($routerId: ID) {
    unavailableFeatures(routerId: $routerId) {
      id
      featureID
      instanceName
      status
      binaryPath
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Configure external storage path for service binaries.
 * Validates path exists and is writable, then persists to settings.
 */
export const CONFIGURE_EXTERNAL_STORAGE = gql`
  mutation ConfigureExternalStorage($input: ConfigureExternalStorageInput!) {
    configureExternalStorage(input: $input) {
      config {
        enabled
        path
        storageInfo {
          path
          totalBytes
          availableBytes
          usedBytes
          filesystem
          mounted
          usagePercent
          locationType
        }
        updatedAt
        isAvailable
      }
      storageInfo {
        path
        totalBytes
        availableBytes
        usedBytes
        filesystem
        mounted
        usagePercent
        locationType
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Reset external storage configuration to use flash only.
 * Optionally migrates existing binaries back to flash.
 */
export const RESET_EXTERNAL_STORAGE = gql`
  mutation ResetExternalStorage($input: ResetExternalStorageInput) {
    resetExternalStorage(input: $input) {
      success
      featuresMigrated
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Manually trigger storage detection scan.
 * Useful for detecting newly mounted storage without restart.
 */
export const SCAN_STORAGE = gql`
  mutation ScanStorage {
    scanStorage {
      storageInfo {
        path
        totalBytes
        availableBytes
        usedBytes
        filesystem
        mounted
        usagePercent
        locationType
      }
      newStorageCount
      errors {
        message
        path
      }
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to storage mount/unmount events.
 * Emits when external storage becomes available or unavailable.
 */
export const SUBSCRIBE_STORAGE_MOUNT_CHANGED = gql`
  subscription StorageMountChanged($path: String) {
    storageMountChanged(path: $path) {
      ... on StorageMountedEvent {
        path
        storageInfo {
          path
          totalBytes
          availableBytes
          usedBytes
          filesystem
          mounted
          usagePercent
          locationType
        }
        featuresRestored
        timestamp
      }
      ... on StorageUnmountedEvent {
        path
        featuresAffected
        affectedFeatureIds
        timestamp
      }
    }
  }
`;

/**
 * Subscribe to storage space threshold events.
 * Emits when storage usage crosses 80%, 90%, or 95% thresholds.
 */
export const SUBSCRIBE_STORAGE_SPACE_CHANGED = gql`
  subscription StorageSpaceChanged($path: String) {
    storageSpaceChanged(path: $path) {
      path
      status
      previousStatus
      usagePercent
      availableBytes
      timestamp
    }
  }
`;
