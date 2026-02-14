import { gql } from '@apollo/client';

/**
 * GraphQL operations for service configuration management (NAS-8.5)
 */

/**
 * Query to get configuration schema for a service type
 */
export const GET_SERVICE_CONFIG_SCHEMA = gql`
  query GetServiceConfigSchema($serviceType: String!) {
    serviceConfigSchema(serviceType: $serviceType) {
      serviceType
      version
      fields {
        name
        label
        type
        description
        required
        defaultValue
        options
        min
        max
        pattern
        placeholder
        group
        dependsOn
        showIf
        sensitive
        validateFunc
      }
    }
  }
`;

/**
 * Query to get current configuration for a service instance
 */
export const GET_INSTANCE_CONFIG = gql`
  query GetInstanceConfig($routerID: ID!, $instanceID: ID!) {
    instanceConfig(routerID: $routerID, instanceID: $instanceID)
  }
`;

/**
 * Mutation to validate service configuration without applying
 */
export const VALIDATE_SERVICE_CONFIG = gql`
  mutation ValidateServiceConfig($input: ValidateServiceConfigInput!) {
    validateServiceConfig(input: $input) {
      valid
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Mutation to apply service configuration
 */
export const APPLY_SERVICE_CONFIG = gql`
  mutation ApplyServiceConfig($input: ApplyServiceConfigInput!) {
    applyServiceConfig(input: $input) {
      success
      message
      errors {
        field
        message
      }
      status
      configPath
    }
  }
`;
