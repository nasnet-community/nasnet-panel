/**
 * Switch Component
 *
 * A toggle switch for boolean input. Built on Radix UI Switch.
 * Uses semantic success color (green) when checked, muted color when unchecked.
 *
 * @example
 * ```tsx
 * import { Switch } from '@nasnet/ui/primitives';
 *
 * // Basic toggle
 * <Switch />
 *
 * // With label
 * <div className="flex items-center gap-2">
 *   <Switch id="dhcp" defaultChecked />
 *   <label htmlFor="dhcp">Enable DHCP</label>
 * </div>
 *
 * // With change handler
 * <Switch onCheckedChange={(checked) => console.log(checked)} />
 * ```
 *
 * When to use:
 * - Toggling features on/off
 * - Settings with boolean values
 * - Enabling/disabling services
 *
 * Don't use when:
 * - You need multiple choice selection (use RadioGroup instead)
 * - You need a on/off visual outside of a form (use Button or Badge)
 *
 * @see https://radix-ui.com/docs/primitives/components/switch
 */

export { Switch } from './switch';
export type { SwitchProps } from './switch';
