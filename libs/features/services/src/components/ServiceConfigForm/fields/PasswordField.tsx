import React, { useState, useCallback, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Button, Icon } from '@nasnet/ui/primitives';
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
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ disabled, 'aria-invalid': ariaInvalid, ...props }, ref) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Handle toggle with useCallback for stability
    const handleToggleVisibility = useCallback(() => {
      setIsPasswordVisible((prev) => !prev);
    }, []);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isPasswordVisible ? 'text' : 'password'}
          disabled={disabled}
          autoComplete="off"
          className="font-mono text-xs"
          aria-invalid={ariaInvalid}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleToggleVisibility}
          tabIndex={-1}
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          <Icon
            icon={isPasswordVisible ? EyeOff : Eye}
            size={16}
            className="text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
