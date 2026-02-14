import { gql } from '@apollo/client';

// ============================================================================
// GraphQL Documents - Service Update Management (NAS-8.7)
// ============================================================================

/**
 * Query to fetch available updates for service instances
 */
export const GET_AVAILABLE_UPDATES = gql`
  query GetAvailableUpdates($routerId: ID!) {
    availableUpdates(routerId: $routerId) {
      instanceId
      instanceName
      featureId
      currentVersion
      latestVersion
      updateAvailable
      severity
      changelogUrl
      releaseDate
      binarySize
      requiredDiskMB
      requiresRestart
      breakingChanges
      securityFixes
    }
  }
`;

/**
 * Mutation to check for updates across all instances
 */
export const CHECK_FOR_UPDATES = gql`
  mutation CheckForUpdates($routerId: ID!) {
    checkForUpdates(routerId: $routerId) {
      success
      checkTime
      updates {
        instanceId
        updateAvailable
        latestVersion
      }
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Mutation to update a single service instance
 */
export const UPDATE_INSTANCE = gql`
  mutation UpdateInstance($routerId: ID!, $instanceId: ID!) {
    updateInstance(routerId: $routerId, instanceId: $instanceId) {
      success
      instance {
        id
        binaryVersion
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Mutation to update all instances with available updates
 */
export const UPDATE_ALL_INSTANCES = gql`
  mutation UpdateAllInstances($routerId: ID!) {
    updateAllInstances(routerId: $routerId) {
      success
      updatedCount
      failedCount
      results {
        instanceId
        success
        error
      }
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Mutation to rollback an instance to previous version
 */
export const ROLLBACK_INSTANCE = gql`
  mutation RollbackInstance($routerId: ID!, $instanceId: ID!) {
    rollbackInstance(routerId: $routerId, instanceId: $instanceId) {
      success
      instance {
        id
        binaryVersion
        updatedAt
      }
      previousVersion
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Subscription for real-time update progress
 */
export const UPDATE_PROGRESS = gql`
  subscription UpdateProgress($routerId: ID!, $instanceId: ID!) {
    updateProgress(routerId: $routerId, instanceId: $instanceId) {
      instanceId
      stage
      progress
      message
      startedAt
      completedAt
      error
      rolledBack
      previousVersion
      newVersion
    }
  }
`;
