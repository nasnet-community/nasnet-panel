/**
 * SaveTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Dialog for saving an existing alert rule as a reusable template.
 * Allows users to name the template, add description, categorize it,
 * and optionally define variables for customization.
 *
 * @description Manages the save workflow: populate form with alert rule data,
 * allow customization, validate with Zod schema, and persist to backend.
 */
import React from 'react';
export interface SaveTemplateDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onOpenChange: (open: boolean) => void;
    /** Alert rule to save as template */
    alertRule: {
        name: string;
        description: string;
        eventType: string;
        severity: 'CRITICAL' | 'WARNING' | 'INFO';
        conditions: Array<{
            field: string;
            operator: string;
            value: string;
        }>;
        channels: string[];
        throttle?: {
            maxAlerts: number;
            periodSeconds: number;
            groupByField?: string;
        };
    };
    /** Callback when template is successfully saved */
    onTemplateSaved?: (templateId: string) => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * SaveTemplateDialog - Save alert rule as reusable template
 *
 * Features:
 * - Pre-fills form with alert rule data
 * - Template naming and description
 * - Category selection (7 categories)
 * - Optional variable definitions for customization
 * - Validation with Zod schema
 * - Success/error feedback with toast notifications
 *
 * Workflow:
 * 1. User opens dialog from existing alert rule
 * 2. Form pre-filled with rule data
 * 3. User customizes name, description, category
 * 4. User optionally defines variables (future enhancement)
 * 5. Save creates custom template
 * 6. Template appears in browser with CUSTOM category
 *
 * @example
 * ```tsx
 * <SaveTemplateDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   alertRule={selectedRule}
 *   onTemplateSaved={(id) => console.log('Saved:', id)}
 * />
 * ```
 */
declare function SaveTemplateDialogComponent(props: SaveTemplateDialogProps): import("react/jsx-runtime").JSX.Element;
declare namespace SaveTemplateDialogComponent {
    var displayName: string;
}
/**
 * Memoized save template dialog for preventing unnecessary re-renders.
 * @description Compares props shallowly to determine if re-render is needed.
 * Beneficial when parent component re-renders frequently.
 */
export declare const SaveTemplateDialog: React.MemoExoticComponent<typeof SaveTemplateDialogComponent>;
export {};
//# sourceMappingURL=SaveTemplateDialog.d.ts.map