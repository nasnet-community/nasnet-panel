/**
 * Alert Rule Templates GraphQL Documents
 * NAS-18.12: Alert Rule Templates Feature
 *
 * GraphQL queries and mutations for alert rule template management.
 * Templates enable users to quickly create alert rules from predefined configurations.
 */
/**
 * Core AlertRuleTemplate fields
 */
export declare const ALERT_RULE_TEMPLATE_FRAGMENT: import('graphql').DocumentNode;
/**
 * Template preview result fields
 */
export declare const ALERT_RULE_TEMPLATE_PREVIEW_FRAGMENT: import('graphql').DocumentNode;
/**
 * Get all alert rule templates with optional category filtering
 *
 * @param category - Filter by template category (NETWORK, SECURITY, RESOURCES, etc.)
 */
export declare const GET_ALERT_RULE_TEMPLATES: import('graphql').DocumentNode;
/**
 * Get a single alert rule template by ID
 *
 * @param id - Template ID
 */
export declare const GET_ALERT_RULE_TEMPLATE_BY_ID: import('graphql').DocumentNode;
/**
 * Preview an alert rule template with variable substitution
 *
 * @param templateId - Template ID to preview
 * @param variables - Variables for template resolution (JSON object)
 */
export declare const PREVIEW_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
/**
 * Apply an alert rule template to create a new alert rule
 *
 * @param templateId - ID of template to apply
 * @param variables - Variable substitutions (JSON object)
 * @param customizations - Optional alert rule customizations
 */
export declare const APPLY_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
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
export declare const SAVE_CUSTOM_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
/**
 * Delete a custom alert rule template
 *
 * @param id - Template ID to delete (built-in templates cannot be deleted)
 */
export declare const DELETE_CUSTOM_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
/**
 * Import an alert rule template from JSON
 *
 * @param json - JSON template definition
 */
export declare const IMPORT_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
/**
 * Export an alert rule template as JSON
 *
 * @param id - Template ID to export
 */
export declare const EXPORT_ALERT_RULE_TEMPLATE: import('graphql').DocumentNode;
//# sourceMappingURL=alert-rule-templates.graphql.d.ts.map
