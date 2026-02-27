/**
 * @fileoverview Label component
 *
 * An accessible label component built on Radix UI Label primitive.
 * Automatically associates with form controls via the `htmlFor` prop.
 * Applies disabled styling when paired with a disabled peer input.
 *
 * Uses semantic color tokens for foreground and supports disabled state styling.
 * Respects dark mode via CSS variables.
 *
 * @example
 * ```tsx
 * <Label htmlFor="username">Username</Label>
 * <input id="username" type="text" />
 * ```
 */
'use client';

import * as React from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const labelVariants = cva(
  'text-foreground cursor-default text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

/**
 * Props for the Label component
 */
export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

/**
 * Accessible label component that associates with form controls.
 * Supports disabled state styling through CSS peer selectors.
 */
const Label = React.memo(
  React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
    ({ className, ...props }, ref) => (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
      />
    )
  )
);
Label.displayName = 'Label';

export { Label };
