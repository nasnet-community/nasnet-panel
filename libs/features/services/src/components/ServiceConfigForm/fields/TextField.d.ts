import React from 'react';
import { Input } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';
/**
 * Props for TextField component
 *
 * Extends standard HTML input attributes with field-specific configuration.
 */
export interface TextFieldProps extends ComponentPropsWithoutRef<typeof Input> {
    /** Whether this field contains sensitive data (hides in logs/errors) */
    sensitive?: boolean;
    /** Custom CSS class name */
    className?: string;
}
/**
 * TextField component for text input fields
 *
 * Renders a standard text input with support for email, URL, IP address,
 * and other text variants. Handles sensitive field configuration and
 * applies appropriate styling for technical data.
 *
 * @example
 * ```tsx
 * <TextField
 *   type="email"
 *   placeholder="Enter email address"
 *   sensitive={false}
 *   onChange={handleChange}
 *   aria-describedby="email-help"
 * />
 * ```
 *
 * @see DynamicField for integration with form schema validation
 */
export declare const TextField: React.ForwardRefExoticComponent<TextFieldProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=TextField.d.ts.map