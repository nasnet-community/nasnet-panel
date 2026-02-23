import React from 'react';
/**
 * Props for ArrayField component
 * @interface ArrayFieldProps
 */
export interface ArrayFieldProps {
    /** Array of string values */
    value?: string[];
    /** Callback when array changes */
    onChange?: (value: string[]) => void;
    /** Placeholder text for input field */
    placeholder?: string;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Regex pattern to validate each item */
    pattern?: string;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Dynamic array field for managing lists of string values
 *
 * Renders an input field with an Add button to build a dynamic array.
 * Each item appears as a dismissible badge. Supports optional regex validation.
 *
 * @example
 * ```tsx
 * <ArrayField
 *   value={servers}
 *   onChange={setServers}
 *   placeholder="Enter server IP and press Enter"
 *   pattern="^[0-9.]+$"
 * />
 * ```
 *
 * @param props - ArrayField component props
 * @returns Rendered array field
 */
export declare const ArrayField: React.NamedExoticComponent<ArrayFieldProps>;
//# sourceMappingURL=ArrayField.d.ts.map