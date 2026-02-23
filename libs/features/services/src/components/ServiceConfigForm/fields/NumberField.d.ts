import React from 'react';
import { Input } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';
/**
 * Props for NumberField component
 *
 * Extends standard HTML input attributes with numeric constraints.
 */
export interface NumberFieldProps extends Omit<ComponentPropsWithoutRef<typeof Input>, 'type'> {
    /** Minimum allowed numeric value */
    min?: number;
    /** Maximum allowed numeric value */
    max?: number;
}
/**
 * NumberField component for numeric input
 *
 * Renders a numeric input field with optional min/max constraints.
 * Suitable for port numbers, counts, thresholds, and other numeric values.
 * Automatically applies monospace font for technical data display.
 *
 * @example
 * ```tsx
 * <NumberField
 *   min={0}
 *   max={65535}
 *   placeholder="Port number (0-65535)"
 *   onChange={handleChange}
 *   aria-describedby="port-help"
 * />
 * ```
 *
 * @see DynamicField for integration with form schema validation
 */
export declare const NumberField: React.ForwardRefExoticComponent<NumberFieldProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=NumberField.d.ts.map