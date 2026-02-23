/**
 * Alert Template Categories
 * @description NAS-18.12: Alert Rule Templates Feature
 *
 * Provides metadata for alert rule template categories including
 * icons, colors, and descriptions for the 7 template categories.
 */
import type { AlertRuleTemplateCategory } from '../schemas/alert-rule-template.schema';
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
/**
 * Alert template category metadata
 * @description Maps each category to its visual representation and description
 */
export declare const ALERT_TEMPLATE_CATEGORIES: Record<AlertRuleTemplateCategory, AlertTemplateCategoryMeta>;
/**
 * Get category metadata by category ID
 * @description Retrieves the visual and descriptive metadata for a specific category
 * @param category The category ID to look up
 * @returns Category metadata including label, description, color, and icons
 */
export declare function getCategoryMeta(category: AlertRuleTemplateCategory): AlertTemplateCategoryMeta;
/**
 * Get all categories as an array
 * @description Retrieves metadata for all available alert template categories
 * @returns Array of category metadata objects in defined order
 */
export declare function getAllCategories(): AlertTemplateCategoryMeta[];
/**
 * Get category count labels for filter display
 * @description Retrieves the human-readable label for a specific category
 * @param category The category ID to get the label for
 * @returns Display label for the category (e.g., "Network", "Security")
 */
export declare function getCategoryLabel(category: AlertRuleTemplateCategory): string;
//# sourceMappingURL=alert-template-categories.d.ts.map