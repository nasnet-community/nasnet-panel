import React, { forwardRef } from 'react';
import { Input } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Props for NumberField component
 *
 * Extends standard HTML input attributes with numeric constraints.
 */
export interface NumberFieldProps
  extends Omit<ComponentPropsWithoutRef<typeof Input>, 'type'> {
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
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    {
      min,
      max,
      className,
      disabled,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) {
    return (
      <Input
        ref={ref}
        type="number"
        disabled={disabled}
        min={min}
        max={max}
        step="1"
        className={cn(
          'font-mono text-xs',
          className
        )}
        aria-invalid={ariaInvalid}
        {...props}
      />
    );
  }
);

NumberField.displayName = 'NumberField';
