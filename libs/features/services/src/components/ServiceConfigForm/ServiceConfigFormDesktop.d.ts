import React from 'react';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';
export interface ServiceConfigFormDesktopProps {
    /** Hook return value from useServiceConfigForm */
    formState: UseServiceConfigFormReturn;
    /** Title for the form */
    title?: string;
    /** Description for the form */
    description?: string;
    /** Whether the form is in read-only mode */
    readOnly?: boolean;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Optional CSS class name for the container */
    className?: string;
}
/**
 * Desktop presenter for service configuration form
 *
 * Desktop-specific features:
 * - Tabbed layout with groups as tabs
 * - 2-column grid for fields (responsive)
 * - Inline action buttons (Save + Cancel)
 * - Denser layout with more information density
 * - Keyboard shortcuts support
 *
 * @example
 * ```tsx
 * const formState = useServiceConfigForm({ ... });
 * <ServiceConfigFormDesktop
 *   formState={formState}
 *   title="Configure Service"
 *   onCancel={() => navigate(-1)}
 * />
 * ```
 */
export declare const ServiceConfigFormDesktop: React.NamedExoticComponent<ServiceConfigFormDesktopProps>;
//# sourceMappingURL=ServiceConfigFormDesktop.d.ts.map