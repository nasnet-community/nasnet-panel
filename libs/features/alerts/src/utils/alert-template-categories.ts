/**
 * Alert Template Categories
 * @description NAS-18.12: Alert Rule Templates Feature
 *
 * Provides metadata for alert rule template categories including
 * icons, colors, and descriptions for the 7 template categories.
 */

import type { AlertRuleTemplateCategory } from '../schemas/alert-rule-template.schema';

// =============================================================================
// Category Metadata Types
// =============================================================================

/**
 * Alert template category metadata
 * @description Defines the display properties and styling for a category
 */
export interface AlertTemplateCategoryMeta {
  id: AlertRuleTemplateCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// =============================================================================
// Category Definitions
// =============================================================================

/**
 * Alert template category metadata
 * @description Maps each category to its visual representation and description
 */
export const ALERT_TEMPLATE_CATEGORIES: Record<
  AlertRuleTemplateCategory,
  AlertTemplateCategoryMeta
> = {
  NETWORK: {
    id: 'NETWORK',
    label: 'Network',
    description: 'Network connectivity, device status, and interface monitoring',
    icon: 'network',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  SECURITY: {
    id: 'SECURITY',
    label: 'Security',
    description: 'Firewall events, intrusion detection, and security threats',
    icon: 'shield',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  RESOURCES: {
    id: 'RESOURCES',
    label: 'Resources',
    description: 'CPU, memory, disk usage, and system resource monitoring',
    icon: 'cpu',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  VPN: {
    id: 'VPN',
    label: 'VPN',
    description: 'VPN tunnel status, connection failures, and authentication',
    icon: 'lock',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  DHCP: {
    id: 'DHCP',
    label: 'DHCP',
    description: 'DHCP pool exhaustion, lease conflicts, and IP assignment',
    icon: 'server',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  SYSTEM: {
    id: 'SYSTEM',
    label: 'System',
    description: 'System updates, backups, configuration changes, and maintenance',
    icon: 'settings',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom',
    description: 'User-created templates for specific monitoring needs',
    icon: 'star',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

/**
 * Get category metadata by category ID
 * @description Retrieves the visual and descriptive metadata for a specific category
 * @param category The category ID to look up
 * @returns Category metadata including label, description, color, and icons
 */
export function getCategoryMeta(category: AlertRuleTemplateCategory): AlertTemplateCategoryMeta {
  return ALERT_TEMPLATE_CATEGORIES[category];
}

/**
 * Get all categories as an array
 * @description Retrieves metadata for all available alert template categories
 * @returns Array of category metadata objects in defined order
 */
export function getAllCategories(): AlertTemplateCategoryMeta[] {
  return Object.values(ALERT_TEMPLATE_CATEGORIES);
}

/**
 * Get category count labels for filter display
 * @description Retrieves the human-readable label for a specific category
 * @param category The category ID to get the label for
 * @returns Display label for the category (e.g., "Network", "Security")
 */
export function getCategoryLabel(category: AlertRuleTemplateCategory): string {
  return ALERT_TEMPLATE_CATEGORIES[category].label;
}
