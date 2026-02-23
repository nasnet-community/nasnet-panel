import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ConfigSchemaField } from '@nasnet/api-client/generated';
/**
 * Props for DynamicField component
 * @interface DynamicFieldProps
 */
export interface DynamicFieldProps {
    /** Field definition from ConfigSchema */
    field: ConfigSchemaField;
    /** React Hook Form instance */
    form: UseFormReturn<any>;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Dynamic field renderer that selects the appropriate field component
 * based on the ConfigFieldType enum value
 *
 * This component handles all field types defined in the backend:
 * - TEXT, TEXT_AREA, PASSWORD, EMAIL, URL, IP_ADDRESS, FILE_PATH, PORT
 * - NUMBER
 * - TOGGLE
 * - SELECT, MULTI_SELECT
 * - TEXT_ARRAY
 *
 * @example
 * ```tsx
 * {visibleFields.map(field => (
 *   <DynamicField key={field.name} field={field} form={form} />
 * ))}
 * ```
 *
 * @param props - DynamicField component props
 * @returns Rendered form field with appropriate input component
 */
export declare const DynamicField: React.NamedExoticComponent<DynamicFieldProps>;
//# sourceMappingURL=DynamicField.d.ts.map