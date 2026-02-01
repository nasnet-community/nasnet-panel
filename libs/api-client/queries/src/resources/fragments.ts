/**
 * Resource GraphQL Fragments
 *
 * Reusable GraphQL fragments for resource queries.
 * These enable selective fetching of resource layers.
 */

import { gql } from '@apollo/client';

/**
 * Minimal resource identification
 */
export const RESOURCE_ID_FRAGMENT = gql`
  fragment ResourceId on Resource {
    uuid
    id
    type
    category
  }
`;

/**
 * Resource with configuration layer
 */
export const RESOURCE_CONFIGURATION_FRAGMENT = gql`
  fragment ResourceConfiguration on Resource {
    ...ResourceId
    configuration
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with validation layer
 */
export const RESOURCE_VALIDATION_FRAGMENT = gql`
  fragment ResourceValidation on Resource {
    ...ResourceId
    validation {
      canApply
      stage
      errors {
        code
        message
        field
        severity
        suggestedFix
      }
      warnings {
        code
        message
        field
        severity
      }
      conflicts {
        type
        conflictingResourceUuid
        description
        resolution
      }
      requiredDependencies {
        resourceUuid
        resourceType
        isActive
        state
        reason
      }
      validatedAt
      validationDurationMs
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with deployment layer
 */
export const RESOURCE_DEPLOYMENT_FRAGMENT = gql`
  fragment ResourceDeployment on Resource {
    ...ResourceId
    deployment {
      routerResourceId
      appliedAt
      appliedBy
      routerVersion
      generatedFields
      isInSync
      drift {
        detectedAt
        driftedFields {
          path
          expected
          actual
        }
        suggestedAction
      }
      applyOperationId
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with runtime layer
 */
export const RESOURCE_RUNTIME_FRAGMENT = gql`
  fragment ResourceRuntime on Resource {
    ...ResourceId
    runtime {
      isRunning
      health
      errorMessage
      metrics {
        bytesIn
        bytesOut
        packetsIn
        packetsOut
        errors
        drops
        throughputIn
        throughputOut
        custom
      }
      lastUpdated
      lastSuccessfulOperation
      activeConnections
      uptime
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with telemetry layer (lightweight)
 */
export const RESOURCE_TELEMETRY_LIGHT_FRAGMENT = gql`
  fragment ResourceTelemetryLight on Resource {
    ...ResourceId
    telemetry {
      lastUpdatedAt
      retentionDays
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with full telemetry layer
 */
export const RESOURCE_TELEMETRY_FULL_FRAGMENT = gql`
  fragment ResourceTelemetryFull on Resource {
    ...ResourceId
    telemetry {
      bandwidthHistory {
        timestamp
        bytesIn
        bytesOut
        periodSeconds
      }
      uptimeHistory {
        timestamp
        isUp
        periodSeconds
      }
      hourlyStats {
        hour
        totalBytesIn
        totalBytesOut
        uptimePercent
        errorCount
      }
      dailyStats {
        date
        totalBytesIn
        totalBytesOut
        uptimePercent
        errorCount
        peakThroughputIn
        peakThroughputOut
      }
      dataStartedAt
      lastUpdatedAt
      retentionDays
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with metadata layer (full)
 */
export const RESOURCE_METADATA_FULL_FRAGMENT = gql`
  fragment ResourceMetadataFull on Resource {
    ...ResourceId
    metadata {
      createdAt
      createdBy
      updatedAt
      updatedBy
      state
      version
      tags
      description
      isFavorite
      isPinned
      notes
      recentChanges {
        timestamp
        user
        changeType
        changedFields
        summary
      }
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with metadata layer (minimal)
 */
export const RESOURCE_METADATA_LIGHT_FRAGMENT = gql`
  fragment ResourceMetadataLight on Resource {
    ...ResourceId
    metadata {
      state
      version
      tags
      updatedAt
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with relationships layer
 */
export const RESOURCE_RELATIONSHIPS_FRAGMENT = gql`
  fragment ResourceRelationships on Resource {
    ...ResourceId
    relationships {
      dependsOn {
        uuid
        id
        type
        category
        state
      }
      dependents {
        uuid
        id
        type
        category
        state
      }
      routesVia {
        uuid
        id
        type
        category
        state
      }
      routedBy {
        uuid
        id
        type
        category
        state
      }
      parent {
        uuid
        id
        type
        category
        state
      }
      children {
        uuid
        id
        type
        category
        state
      }
      custom
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource with platform layer
 */
export const RESOURCE_PLATFORM_FRAGMENT = gql`
  fragment ResourcePlatform on Resource {
    ...ResourceId
    platform {
      current
      capabilities {
        isSupported
        level
        minVersion
        requiredPackages
        details
      }
      fieldMappings
      limitations {
        code
        description
        affectedFields
        workaround
      }
      features {
        id
        name
        enabled
        description
      }
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource list item (optimized for mobile)
 */
export const RESOURCE_LIST_ITEM_FRAGMENT = gql`
  fragment ResourceListItem on Resource {
    uuid
    id
    type
    category
    metadata {
      state
      tags
      updatedAt
      isFavorite
    }
    runtime {
      isRunning
      health
      lastUpdated
    }
  }
`;

/**
 * Resource card (for dashboards)
 */
export const RESOURCE_CARD_FRAGMENT = gql`
  fragment ResourceCard on Resource {
    ...ResourceId
    configuration
    metadata {
      state
      version
      tags
      description
      isFavorite
      isPinned
    }
    runtime {
      isRunning
      health
      errorMessage
      activeConnections
      uptime
    }
  }
  ${RESOURCE_ID_FRAGMENT}
`;

/**
 * Resource detail view (all layers except full telemetry)
 */
export const RESOURCE_DETAIL_FRAGMENT = gql`
  fragment ResourceDetail on Resource {
    ...ResourceId
    configuration
    validation {
      canApply
      stage
      errors {
        code
        message
        field
        severity
        suggestedFix
        docsUrl
      }
      warnings {
        code
        message
        field
        severity
      }
      conflicts {
        type
        conflictingResourceUuid
        description
        resolution
      }
      validatedAt
    }
    deployment {
      routerResourceId
      appliedAt
      appliedBy
      isInSync
      drift {
        detectedAt
        suggestedAction
      }
    }
    runtime {
      isRunning
      health
      errorMessage
      metrics {
        bytesIn
        bytesOut
        throughputIn
        throughputOut
        errors
      }
      lastUpdated
      activeConnections
      uptime
    }
    ...ResourceMetadataFull
    ...ResourceRelationships
    platform {
      current
      capabilities {
        isSupported
        level
      }
      limitations {
        code
        description
      }
    }
  }
  ${RESOURCE_ID_FRAGMENT}
  ${RESOURCE_METADATA_FULL_FRAGMENT}
  ${RESOURCE_RELATIONSHIPS_FRAGMENT}
`;

/**
 * Full resource with all 8 layers
 */
export const RESOURCE_FULL_FRAGMENT = gql`
  fragment ResourceFull on Resource {
    ...ResourceConfiguration
    ...ResourceValidation
    ...ResourceDeployment
    ...ResourceRuntime
    ...ResourceTelemetryFull
    ...ResourceMetadataFull
    ...ResourceRelationships
    ...ResourcePlatform
  }
  ${RESOURCE_CONFIGURATION_FRAGMENT}
  ${RESOURCE_VALIDATION_FRAGMENT}
  ${RESOURCE_DEPLOYMENT_FRAGMENT}
  ${RESOURCE_RUNTIME_FRAGMENT}
  ${RESOURCE_TELEMETRY_FULL_FRAGMENT}
  ${RESOURCE_METADATA_FULL_FRAGMENT}
  ${RESOURCE_RELATIONSHIPS_FRAGMENT}
  ${RESOURCE_PLATFORM_FRAGMENT}
`;
