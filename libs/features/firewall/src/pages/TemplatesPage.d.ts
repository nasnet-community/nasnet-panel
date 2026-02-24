/**
 * TemplatesPage - Firewall Templates Management Page
 *
 * Main page composing TemplateGallery + TemplateApplyFlow + Custom Template Management.
 * Implements Layer 3 domain component pattern.
 *
 * Features:
 * - Browse built-in and custom templates
 * - Apply templates with variable configuration
 * - Create custom templates from existing rules
 * - Import/export templates
 * - Safety Pipeline with undo functionality
 *
 * @module @nasnet/features/firewall/pages
 */
/**
 * TemplatesPage Component Props
 * @description Props for firewall templates management page
 */
export interface TemplatesPageProps {
    /** Router ID for template operations */
    routerId: string;
    /** Current firewall rules (for creating custom templates) */
    currentRules?: any[];
    /** Optional CSS class for styling */
    className?: string;
}
/**
 * TemplatesPage Component
 * @description Main page for managing firewall templates with browsing, applying, and custom template creation
 */
export declare const TemplatesPage: import("react").NamedExoticComponent<TemplatesPageProps>;
//# sourceMappingURL=TemplatesPage.d.ts.map