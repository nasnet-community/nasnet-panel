import * as React from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the Switch component
 *
 * @interface SwitchProps
 * @extends {React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>}
 * @property {string} [className] - Additional CSS classes to apply
 */
export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  /** Additional CSS classes to apply */
  className?: string;
}

// ============================================================================
// Switch Component
// ============================================================================

/**
 * Switch Component
 *
 * A toggle switch for boolean input. Built on Radix UI Switch.
 * Uses semantic success color when checked, muted color when unchecked.
 * Supports disabled state with reduced opacity.
 *
 * Accessibility:
 * - Full keyboard navigation (Tab, Space/Enter to toggle)
 * - Focus visible indicator with ring
 * - Screen reader support via Radix UI
 * - Respects disabled state
 *
 * @example
 * ```tsx
 * // Basic toggle
 * <Switch />
 *
 * // With initial state
 * <Switch defaultChecked />
 *
 * // Disabled
 * <Switch disabled />
 *
 * // With change handler
 * <Switch onCheckedChange={(checked) => console.log(checked)} />
 * ```
 *
 * @see https://radix-ui.com/docs/primitives/components/switch
 */
const Switch = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    SwitchProps
  >(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-success data-[state=unchecked]:bg-muted',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-card shadow-lg ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1'
        )}
      />
    </SwitchPrimitives.Root>
  ))
);

Switch.displayName = 'Switch';

export { Switch };
