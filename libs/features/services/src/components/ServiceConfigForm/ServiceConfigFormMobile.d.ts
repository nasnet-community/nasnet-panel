import React from 'react';
import type { UseServiceConfigFormReturn } from '../../hooks/useServiceConfigForm';
export interface ServiceConfigFormMobileProps {
    /** Hook return value from useServiceConfigForm */
    formState: UseServiceConfigFormReturn;
    /** Title for the form */
    title?: string;
    /** Whether the form is in read-only mode */
    readOnly?: boolean;
    /** Optional CSS class name for the container */
    className?: string;
}
/**
 * Mobile presenter for service configuration form
 *
 * Mobile-specific features:
 * - Accordion-style layout with collapsible groups
 * - Full-width inputs (single column)
 * - 44px minimum touch targets
 * - Bottom sticky action buttons
 * - Simplified layout for small screens
 *
 * @example
 * ```tsx
 * const formState = useServiceConfigForm({ ... });
 * <ServiceConfigFormMobile
 *   formState={formState}
 *   title="Configure Service"
 * />
 * ```
 */
export declare const ServiceConfigFormMobile: React.NamedExoticComponent<ServiceConfigFormMobileProps>;
//# sourceMappingURL=ServiceConfigFormMobile.d.ts.map