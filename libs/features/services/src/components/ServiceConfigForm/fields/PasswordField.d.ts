import React from 'react';
import { Input } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';
/**
 * Props for PasswordField component
 *
 * Extends standard HTML input attributes (excluding 'type' which is fixed to 'password').
 */
export type PasswordFieldProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type'>;
/**
 * PasswordField component for secure password input
 *
 * Renders a password input with a toggle button to show/hide the password value.
 * Automatically disables autocomplete and applies security best practices.
 * Includes proper accessibility with aria-labels and screen reader support.
 *
 * @example
 * ```tsx
 * <PasswordField
 *   placeholder="Enter password"
 *   onChange={handleChange}
 *   aria-describedby="password-requirements"
 * />
 * ```
 *
 * @see DynamicField for integration with form schema validation
 */
export declare const PasswordField: React.ForwardRefExoticComponent<PasswordFieldProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=PasswordField.d.ts.map