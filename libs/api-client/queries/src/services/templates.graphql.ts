/**
 * Service Templates GraphQL Documents
 *
 * GraphQL queries, mutations, and subscriptions for template operations.
 */

import { gql } from '@apollo/client';

/**
 * Fragment for template variable fields
 */
const TEMPLATE_VARIABLE_FRAGMENT = gql`
  fragment TemplateVariableFields on TemplateVariable {
    name
    type
    required
    default
    description
    label
    validationPattern
    minValue
    maxValue
    enumValues
  }
`;

/**
 * Fragment for service spec fields
 */
const SERVICE_SPEC_FRAGMENT = gql`
  fragment ServiceSpecFields on ServiceSpec {
    serviceType
    name
    configOverrides
    dependsOn
    memoryLimitMB
    cpuShares
    requiresBridge
    vlanID
    portMappings {
      internal
      external
      protocol
      purpose
    }
  }
`;

/**
 * Fragment for resource estimate fields
 */
const RESOURCE_ESTIMATE_FRAGMENT = gql`
  fragment ResourceEstimateFields on ResourceEstimate {
    totalMemoryMB
    totalCPUShares
    diskSpaceMB
    networkPorts
    vlansRequired
  }
`;

/**
 * Fragment for service template fields
 */
const SERVICE_TEMPLATE_FRAGMENT = gql`
  ${TEMPLATE_VARIABLE_FRAGMENT}
  ${SERVICE_SPEC_FRAGMENT}
  ${RESOURCE_ESTIMATE_FRAGMENT}

  fragment ServiceTemplateFields on ServiceTemplate {
    id
    name
    description
    category
    scope
    version
    isBuiltIn
    author
    routerID
    services {
      ...ServiceSpecFields
    }
    configVariables {
      ...TemplateVariableFields
    }
    suggestedRouting {
      devicePattern
      targetService
      protocol
      destinationPort
      description
    }
    estimatedResources {
      ...ResourceEstimateFields
    }
    tags
    prerequisites
    documentation
    examples
    createdAt
    updatedAt
  }
`;

/**
 * Query: Get all service templates
 */
export const GET_SERVICE_TEMPLATES = gql`
  ${SERVICE_TEMPLATE_FRAGMENT}

  query GetServiceTemplates(
    $routerID: ID
    $category: ServiceTemplateCategory
    $scope: TemplateScope
  ) {
    serviceTemplates(routerID: $routerID, category: $category, scope: $scope) {
      ...ServiceTemplateFields
    }
  }
`;

/**
 * Query: Get a specific service template by ID
 */
export const GET_SERVICE_TEMPLATE = gql`
  ${SERVICE_TEMPLATE_FRAGMENT}

  query GetServiceTemplate($id: ID!) {
    serviceTemplate(id: $id) {
      ...ServiceTemplateFields
    }
  }
`;

/**
 * Mutation: Install a service template
 */
export const INSTALL_SERVICE_TEMPLATE = gql`
  mutation InstallServiceTemplate($input: InstallServiceTemplateInput!) {
    installServiceTemplate(input: $input) {
      success
      instanceIDs
      serviceMapping
      errors
      progress {
        templateID
        totalServices
        installedCount
        currentService
        status
        errorMessage
        startedAt
        completedAt
        serviceResults {
          serviceName
          instanceID
          status
          errorMessage
          createdAt
        }
      }
    }
  }
`;

/**
 * Mutation: Export existing instances as a template
 */
export const EXPORT_AS_TEMPLATE = gql`
  ${SERVICE_TEMPLATE_FRAGMENT}

  mutation ExportAsTemplate($input: ExportAsTemplateInput!) {
    exportAsTemplate(input: $input) {
      ...ServiceTemplateFields
    }
  }
`;

/**
 * Mutation: Import a service template from JSON
 */
export const IMPORT_SERVICE_TEMPLATE = gql`
  ${SERVICE_TEMPLATE_FRAGMENT}

  mutation ImportServiceTemplate($input: ImportServiceTemplateInput!) {
    importServiceTemplate(input: $input) {
      ...ServiceTemplateFields
    }
  }
`;

/**
 * Mutation: Delete a user-created service template
 */
export const DELETE_SERVICE_TEMPLATE = gql`
  mutation DeleteServiceTemplate($routerID: ID!, $templateID: ID!) {
    deleteServiceTemplate(routerID: $routerID, templateID: $templateID)
  }
`;

/**
 * Subscription: Template installation progress
 */
export const TEMPLATE_INSTALL_PROGRESS = gql`
  subscription TemplateInstallProgress($routerID: ID!) {
    templateInstallProgress(routerID: $routerID) {
      templateID
      totalServices
      installedCount
      currentService
      status
      errorMessage
      startedAt
      completedAt
      serviceResults {
        serviceName
        instanceID
        status
        errorMessage
        createdAt
      }
    }
  }
`;
