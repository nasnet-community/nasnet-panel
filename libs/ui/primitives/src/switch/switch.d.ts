import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
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
declare const Switch: React.MemoExoticComponent<React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>>;
export { Switch };
//# sourceMappingURL=switch.d.ts.map