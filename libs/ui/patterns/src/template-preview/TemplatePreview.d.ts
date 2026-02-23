/**
 * TemplatePreview Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const preview = useTemplatePreview({
 *   template: selectedTemplate,
 *   onGeneratePreview: handleGeneratePreview,
 * });
 *
 * <TemplatePreview
 *   preview={preview}
 *   onApply={handleApply}
 *   onCancel={handleCancel}
 * />
 * ```
 */
import type { UseTemplatePreviewReturn } from './use-template-preview';
export interface TemplatePreviewProps {
    /** Template preview hook return value */
    preview: UseTemplatePreviewReturn;
    /** Callback when Apply button is clicked */
    onApply?: () => void;
    /** Callback when Cancel button is clicked */
    onCancel?: () => void;
    /** Whether apply action is loading */
    isApplying?: boolean;
    /** Container className */
    className?: string;
}
/**
 * TemplatePreview - Preview and configure firewall template
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Accordion sections with 44px touch targets
 * - Tablet/Desktop (>=640px): Two-column layout with tabbed preview
 *
 * Features:
 * - React Hook Form + Zod validation for variables
 * - Type-specific inputs (IP, SUBNET, PORT, VLAN_ID, INTERFACE)
 * - Real-time validation feedback
 * - Generate preview with resolved rules
 * - Conflict detection and display
 * - Impact analysis summary
 * - Apply/Cancel actions
 */
declare function TemplatePreviewComponent(props: TemplatePreviewProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplatePreview: import("react").MemoExoticComponent<typeof TemplatePreviewComponent>;
export {};
//# sourceMappingURL=TemplatePreview.d.ts.map