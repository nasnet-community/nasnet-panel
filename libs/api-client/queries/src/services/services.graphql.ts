import { gql } from '@apollo/client';

/**
 * GraphQL documents for Service Instance Management
 * Feature Marketplace: Tor, sing-box, Xray, MTProxy, Psiphon, AdGuard Home
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * List all available services from the Feature Marketplace
 */
export const GET_AVAILABLE_SERVICES = gql`
  query GetAvailableServices($category: String, $architecture: String) {
    availableServices(category: $category, architecture: $architecture) {
      id
      name
      description
      version
      category
      author
      license
      homepage
      icon
      tags
      architectures
      minRouterOsVersion
      requiredPackages
      requiredPorts
      requiredMemoryMb
      requiredDiskMb
      dockerImage
      dockerTag
      defaultConfig
      configSchema
    }
  }
`;

/**
 * List all service instances for a router
 */
export const GET_SERVICE_INSTANCES = gql`
  query GetServiceInstances(
    $routerID: ID!
    $status: ServiceStatus
    $featureID: String
  ) {
    serviceInstances(
      routerID: $routerID
      status: $status
      featureID: $featureID
    ) {
      id
      featureID
      instanceName
      routerID
      status
      vlanID
      bindIP
      ports
      config
      binaryPath
      binaryVersion
      binaryChecksum
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get a specific service instance
 */
export const GET_SERVICE_INSTANCE = gql`
  query GetServiceInstance($routerID: ID!, $instanceID: ID!) {
    serviceInstance(routerID: $routerID, instanceID: $instanceID) {
      id
      featureID
      instanceName
      routerID
      status
      vlanID
      bindIP
      ports
      config
      binaryPath
      binaryVersion
      binaryChecksum
      createdAt
      updatedAt
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Install a new service instance on a router
 */
export const INSTALL_SERVICE = gql`
  mutation InstallService($input: InstallServiceInput!) {
    installService(input: $input) {
      instance {
        id
        featureID
        instanceName
        routerID
        status
        vlanID
        bindIP
        ports
        config
        binaryPath
        binaryVersion
        binaryChecksum
        createdAt
        updatedAt
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Start a service instance
 */
export const START_INSTANCE = gql`
  mutation StartInstance($input: StartInstanceInput!) {
    startInstance(input: $input) {
      instance {
        id
        status
        updatedAt
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Stop a service instance
 */
export const STOP_INSTANCE = gql`
  mutation StopInstance($input: StopInstanceInput!) {
    stopInstance(input: $input) {
      instance {
        id
        status
        updatedAt
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Restart a service instance
 */
export const RESTART_INSTANCE = gql`
  mutation RestartInstance($input: RestartInstanceInput!) {
    restartInstance(input: $input) {
      instance {
        id
        status
        updatedAt
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Delete a service instance
 */
export const DELETE_INSTANCE = gql`
  mutation DeleteInstance($input: DeleteInstanceInput!) {
    deleteInstance(input: $input) {
      instance {
        id
      }
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
 * Subscribe to installation progress events
 */
export const SUBSCRIBE_INSTALL_PROGRESS = gql`
  subscription InstallProgress($routerID: ID!) {
    installProgress(routerID: $routerID) {
      instanceID
      featureID
      bytesDownloaded
      totalBytes
      percent
      status
      errorMessage
    }
  }
`;

/**
 * Subscribe to instance status change events
 */
export const SUBSCRIBE_INSTANCE_STATUS_CHANGED = gql`
  subscription InstanceStatusChanged($routerID: ID!) {
    instanceStatusChanged(routerID: $routerID) {
      instanceID
      previousStatus
      newStatus
      timestamp
    }
  }
`;

// =============================================================================
// Dependency Management Queries (NAS-8.19)
// =============================================================================

/**
 * Get all dependencies of a service instance (services it depends on)
 */
export const GET_DEPENDENCIES = gql`
  query GetDependencies($instanceId: ID!) {
    serviceDependencies(instanceId: $instanceId) {
      id
      fromInstance {
        id
        featureID
        instanceName
        status
      }
      toInstance {
        id
        featureID
        instanceName
        status
      }
      dependencyType
      autoStart
      healthTimeoutSeconds
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get all dependents of a service instance (services that depend on it)
 */
export const GET_DEPENDENTS = gql`
  query GetDependents($instanceId: ID!) {
    serviceDependents(instanceId: $instanceId) {
      id
      fromInstance {
        id
        featureID
        instanceName
        status
      }
      toInstance {
        id
        featureID
        instanceName
        status
      }
      dependencyType
      autoStart
      healthTimeoutSeconds
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get the full dependency graph for a router (for visualization)
 */
export const GET_DEPENDENCY_GRAPH = gql`
  query GetDependencyGraph($routerId: ID!) {
    dependencyGraph(routerId: $routerId) {
      nodes {
        instanceId
        instanceName
        featureId
        status
      }
      edges {
        fromInstanceId
        toInstanceId
        dependencyType
        autoStart
        healthTimeoutSeconds
      }
    }
  }
`;

/**
 * Get the current boot sequence progress (if running)
 */
export const GET_BOOT_SEQUENCE_PROGRESS = gql`
  query GetBootSequenceProgress {
    bootSequenceProgress {
      inProgress
      currentLayer
      totalLayers
      startedInstances
      failedInstances
      remainingInstances
    }
  }
`;

// =============================================================================
// Dependency Management Mutations (NAS-8.19)
// =============================================================================

/**
 * Add a new dependency relationship between service instances
 */
export const ADD_DEPENDENCY = gql`
  mutation AddDependency($input: AddDependencyInput!) {
    addDependency(input: $input) {
      id
      fromInstance {
        id
        featureID
        instanceName
        status
      }
      toInstance {
        id
        featureID
        instanceName
        status
      }
      dependencyType
      autoStart
      healthTimeoutSeconds
      createdAt
      updatedAt
    }
  }
`;

/**
 * Remove an existing dependency relationship
 */
export const REMOVE_DEPENDENCY = gql`
  mutation RemoveDependency($input: RemoveDependencyInput!) {
    removeDependency(input: $input)
  }
`;

/**
 * Manually trigger the boot sequence for auto-start instances
 */
export const TRIGGER_BOOT_SEQUENCE = gql`
  mutation TriggerBootSequence {
    triggerBootSequence
  }
`;

// =============================================================================
// Dependency Management Subscriptions (NAS-8.19)
// =============================================================================

/**
 * Subscribe to boot sequence events
 */
export const SUBSCRIBE_BOOT_SEQUENCE_EVENTS = gql`
  subscription BootSequenceEvents {
    bootSequenceEvents {
      id
      type
      timestamp
      layer
      instanceIds
      successCount
      failureCount
      errorMessage
    }
  }
`;
