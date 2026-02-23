import React from 'react';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';
/**
 * Props for ServiceConfigForm component
 * @interface ServiceConfigFormProps
 */
export interface ServiceConfigFormProps {
    /** Hook return value from useServiceConfigForm with form state and handlers */
    formState: UseServiceConfigFormReturn;
    /** Title displayed in form header */
    title?: string;
    /** Description displayed below title (desktop only) */
    description?: string;
    /** Whether the form is in read-only mode */
    readOnly?: boolean;
    /** Callback when cancel is clicked (desktop only) */
    onCancel?: () => void;
    /** Manual platform override ('mobile' | 'tablet' | 'desktop') */
    presenter?: 'mobile' | 'tablet' | 'desktop';
    /** Optional CSS class name */
    className?: string;
}
/**
 * Service configuration form with platform presenters
 *
 * Automatically detects platform and renders appropriate presenter:
 * - Mobile (<640px): Accordion layout, full-width fields, sticky bottom buttons
 * - Desktop (>=640px): Tabbed layout, 2-column grid, inline buttons
 *
 * Features:
 * - React.memo() for performance optimization
 * - Headless hook pattern: all state in useServiceConfigForm
 * - Memoized presenter selection
 * - Support for read-only mode
 * - Keyboard accessibility (Enter to submit)
 * - Screen reader support for loading/error states
 *
 * @example
 * ```tsx
 * function ServiceConfigPage({ serviceType, routerID, instanceID }) {
 *   const formState = useServiceConfigForm({
 *     serviceType,
 *     routerID,
 *     instanceID,
 *     onSuccess: () => toast.success('Configuration saved!'),
 *     onError: (msg) => toast.error(msg),
 *   });
 *
 *   return (
 *     <ServiceConfigForm
 *       formState={formState}
 *       title="Tor Configuration"
 *       description="Configure your Tor service settings"
 *     />
 *   );
 * }
 * ```
 *
 * @param props - ServiceConfigForm component props
 * @returns Rendered service configuration form
 */
export declare const ServiceConfigForm: React.NamedExoticComponent<ServiceConfigFormProps>;
//# sourceMappingURL=ServiceConfigForm.d.ts.map