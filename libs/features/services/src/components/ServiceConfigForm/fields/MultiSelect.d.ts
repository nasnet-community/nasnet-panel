import React from 'react';
/**
 * Props for MultiSelect field component
 * @interface MultiSelectProps
 */
export interface MultiSelectProps {
    /** Array of selected values */
    value?: string[];
    /** Callback when selections change */
    onChange?: (value: string[]) => void;
    /** Array of options (strings or {value, label} objects) */
    options: Array<string | {
        value: string;
        label: string;
    }>;
    /** Placeholder text when no selections */
    placeholder?: string;
    /** Whether the multi-select is disabled */
    disabled?: boolean;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Multi-select dropdown field for multiple choice selection
 *
 * Renders a popover with checkboxes for selecting multiple values.
 * Shows selected items as dismissible badges below the trigger.
 *
 * @example
 * ```tsx
 * <MultiSelect
 *   value={countries}
 *   onChange={setCountries}
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'de', label: 'Germany' },
 *   ]}
 *   placeholder="Select countries"
 * />
 * ```
 *
 * @param props - MultiSelect component props
 * @returns Rendered multi-select dropdown
 */
export declare const MultiSelect: React.NamedExoticComponent<MultiSelectProps>;
//# sourceMappingURL=MultiSelect.d.ts.map