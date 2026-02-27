import React, { forwardRef } from 'react';
import { Input } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
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
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { type = 'text', sensitive = false, className, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref
) {
  // Apply monospace font for technical data types
  const isTechnicalType = type === 'email' || type === 'url' || type === 'password' || sensitive;

  return (
    <Input
      ref={ref}
      type={type}
      disabled={disabled}
      autoComplete={sensitive ? 'off' : undefined}
      className={cn(isTechnicalType && 'font-mono text-xs', className)}
      aria-invalid={ariaInvalid}
      {...props}
    />
  );
});

TextField.displayName = 'TextField';
