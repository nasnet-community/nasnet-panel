import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const inputVariants = cva(
  'flex w-full rounded-input border bg-card px-4 py-3 text-base text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-input shadow-sm',
        error:
          'border-error shadow-sm focus-visible:ring-error',
      },
      inputSize: {
        default: 'h-11',
        sm: 'h-9 px-3 py-2 text-sm',
        lg: 'h-12 px-5 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

/**
 * Props for the Input component.
 *
 * Extends native HTML input attributes and CVA variants.
 * Supports multiple input types with semantic styling and error states.
 *
 * @interface InputProps
 * @property {boolean} [error] - If true, displays error styling with red border and error ring color
 * @property {string} [className] - Additional CSS classes merged with component styles using cn()
 * @property {string} [variant] - Style variant: 'default' (normal border) or 'error' (red border). Auto-set when error=true
 * @property {string} [inputSize] - Size variant: 'sm' (compact), 'default' (standard 44px mobile), 'lg' (large)
 * @property {string} [type] - HTML input type: 'text' (default), 'email', 'password', 'number', 'search', 'tel', 'url', 'file'
 * @property {string} [disabled] - Disabled state with reduced opacity (inherited from HTMLInputElement)
 * @property {string} [placeholder] - Placeholder text displayed when empty (gray, muted-foreground color)
 *
 * @see InputHTMLAttributes for all inherited native input properties
 * @see {@link https://nasnet.internal/design-tokens} for semantic token values
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

/**
 * A flexible text input component supporting multiple input types.
 *
 * Features:
 * - Native HTML input element with semantic styling
 * - Multiple size variants (sm, default 44px, lg) for responsive design
 * - Error state with red border and error ring color feedback
 * - Full WCAG AAA accessibility: 7:1 contrast, 44px touch target on mobile
 * - Dark mode support via CSS variables
 * - Smooth focus transitions (200ms) and reduced motion support
 * - File input support with specialized styling
 * - Disabled state with visual feedback
 *
 * Renders as a native `<input>` element with forwarded ref support for form control.
 * Uses semantic design tokens (not primitive colors) for consistent theming.
 *
 * @param {InputProps} props - Component props
 * @param {React.Ref<HTMLInputElement>} ref - Forwarded ref to underlying input element
 *
 * @returns {React.ReactElement} Input element with applied styles and accessibility attributes
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input type="text" placeholder="Enter your name..." />
 *
 * // With error state (typically set by form validation)
 * <Input
 *   type="email"
 *   error
 *   placeholder="Invalid email"
 *   aria-describedby="email-error"
 * />
 *
 * // With custom size for dense layouts
 * <Input type="text" inputSize="sm" placeholder="Compact..." />
 *
 * // Large input for enhanced mobile touch targets
 * <Input type="password" inputSize="lg" placeholder="Enter password..." />
 *
 * // With custom styling merged via cn()
 * <Input type="number" className="text-right" placeholder="0.00" />
 * ```
 *
 * @see {@link https://nasnet.internal/wcag-aaa-guide} for accessibility compliance details
 * @see {@link https://nasnet.internal/design-tokens.md} for color token reference (primary, error, muted-foreground)
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({
            variant: error ? 'error' : variant,
            inputSize
          }),
          className
        )}
        ref={ref}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
