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
