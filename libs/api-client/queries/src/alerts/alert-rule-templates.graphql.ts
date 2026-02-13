/**
 * Alert Rule Templates GraphQL Documents
 * NAS-18.12: Alert Rule Templates Feature
 *
 * GraphQL queries and mutations for alert rule template management.
 * Templates enable users to quickly create alert rules from predefined configurations.
 */

import { gql } from '@apollo/client';

// =============================================================================
// Fragments
// =============================================================================

/**
 * Core AlertRuleTemplate fields
 */
export const ALERT_RULE_TEMPLATE_FRAGMENT = gql`
  fragment AlertRuleTemplateFields on AlertRuleTemplate {
    id
    name
    description
    category
    eventType
    severity
    conditions {
      field
      operator
      value
    }
    channels
    throttle {
      maxAlerts
      periodSeconds
      groupByField
    }
    variables {
      name
      label
      type
      required
      defaultValue
      description
      min
      max
      unit
    }
    isBuiltIn
    version
    createdAt
    updatedAt
  }
`;

/**
 * Template preview result fields
 */
export const ALERT_RULE_TEMPLATE_PREVIEW_FRAGMENT = gql`
  fragment AlertRuleTemplatePreviewFields on AlertRuleTemplatePreview {
    template {
      ...AlertRuleTemplateFields
    }
    resolvedConditions {
      field
      operator
      value
    }
    validationInfo {
      isValid
      missingVariables
      warnings
    }
  }
  ${ALERT_RULE_TEMPLATE_FRAGMENT}
`;

// =============================================================================
// Queries
// =============================================================================

/**
 * Get all alert rule templates with optional category filtering
 *
 * @param category - Filter by template category (NETWORK, SECURITY, RESOURCES, etc.)
 */
export const GET_ALERT_RULE_TEMPLATES = gql`
  query GetAlertRuleTemplates($category: AlertRuleTemplateCategory) {
    alertRuleTemplates(category: $category) {
      ...AlertRuleTemplateFields
    }
  }
  ${ALERT_RULE_TEMPLATE_FRAGMENT}
`;

/**
 * Get a single alert rule template by ID
 *
 * @param id - Template ID
 */
export const GET_ALERT_RULE_TEMPLATE_BY_ID = gql`
  query GetAlertRuleTemplateById($id: ID!) {
    alertRuleTemplate(id: $id) {
      ...AlertRuleTemplateFields
    }
  }
  ${ALERT_RULE_TEMPLATE_FRAGMENT}
`;

/**
 * Preview an alert rule template with variable substitution
 *
 * @param templateId - Template ID to preview
 * @param variables - Variables for template resolution (JSON object)
 */
export const PREVIEW_ALERT_RULE_TEMPLATE = gql`
  query PreviewAlertRuleTemplate($templateId: ID!, $variables: JSON!) {
    previewAlertRuleTemplate(templateId: $templateId, variables: $variables) {
      preview {
        ...AlertRuleTemplatePreviewFields
      }
      errors {
        field
        message
      }
    }
  }
  ${ALERT_RULE_TEMPLATE_PREVIEW_FRAGMENT}
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Apply an alert rule template to create a new alert rule
 *
 * @param templateId - ID of template to apply
 * @param variables - Variable substitutions (JSON object)
 * @param customizations - Optional alert rule customizations
 */
export const APPLY_ALERT_RULE_TEMPLATE = gql`
  mutation ApplyAlertRuleTemplate(
    $templateId: ID!
    $variables: JSON!
    $customizations: CreateAlertRuleInput
  ) {
    applyAlertRuleTemplate(
      templateId: $templateId
      variables: $variables
      customizations: $customizations
    ) {
      alertRule {
        id
        name
        description
        eventType
        conditions {
          field
          operator
          value
        }
        severity
        channels
        throttle {
          maxAlerts
          periodSeconds
          groupByField
        }
        enabled
        createdAt
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
 * Save a custom alert rule template
 *
 * @param input - Template configuration
 * @param input.name - Template name
 * @param input.description - Template description
 * @param input.category - Template category
 * @param input.eventType - Event type this template monitors
 * @param input.severity - Alert severity level
 * @param input.conditions - Pre-configured conditions
 * @param input.channels - Default notification channels
 * @param input.throttle - Optional throttle configuration
 * @param input.variables - Template variable definitions
 */
export const SAVE_CUSTOM_ALERT_RULE_TEMPLATE = gql`
  mutation SaveCustomAlertRuleTemplate($input: SaveAlertRuleTemplateInput!) {
    saveCustomAlertRuleTemplate(input: $input) {
      template {
        ...AlertRuleTemplateFields
      }
      errors {
        field
        message
      }
    }
  }
  ${ALERT_RULE_TEMPLATE_FRAGMENT}
`;

/**
 * Delete a custom alert rule template
 *
 * @param id - Template ID to delete (built-in templates cannot be deleted)
 */
export const DELETE_CUSTOM_ALERT_RULE_TEMPLATE = gql`
  mutation DeleteCustomAlertRuleTemplate($id: ID!) {
    deleteCustomAlertRuleTemplate(id: $id) {
      success
      deletedId
      errors {
        field
        message
      }
    }
  }
`;

/**
 * Import an alert rule template from JSON
 *
 * @param json - JSON template definition
 */
export const IMPORT_ALERT_RULE_TEMPLATE = gql`
  mutation ImportAlertRuleTemplate($json: String!) {
    importAlertRuleTemplate(json: $json) {
      template {
        ...AlertRuleTemplateFields
      }
      errors {
        field
        message
      }
    }
  }
  ${ALERT_RULE_TEMPLATE_FRAGMENT}
`;

/**
 * Export an alert rule template as JSON
 *
 * @param id - Template ID to export
 */
export const EXPORT_ALERT_RULE_TEMPLATE = gql`
  mutation ExportAlertRuleTemplate($id: ID!) {
    exportAlertRuleTemplate(id: $id)
  }
`;
