import React from 'react';
/**
 * Props for Select field component
 * @interface SelectProps
 */
export interface SelectProps {
    /** Selected value */
    value?: string;
    /** Callback when selection changes */
    onValueChange?: (value: string) => void;
    /** Array of options (strings or {value, label} objects) */
    options: Array<string | {
        value: string;
        label: string;
    }>;
    /** Placeholder text when no selection */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Select dropdown field for single-choice selection
 *
 * Renders a dropdown using the primitives Select component.
 * Automatically converts string options to {value, label} format.
 *
 * @example
 * ```tsx
 * <Select
 *   value={mode}
 *   onValueChange={setMode}
 *   options={[
 *     { value: 'exit', label: 'Exit relay' },
 *     { value: 'middle', label: 'Middle relay' },
 *   ]}
 *   placeholder="Select mode"
 * />
 * ```
 *
 * @param props - Select component props
 * @returns Rendered select dropdown
 */
export declare const Select: React.NamedExoticComponent<SelectProps>;
//# sourceMappingURL=Select.d.ts.map