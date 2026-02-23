/**
 * Select Component Exports
 *
 * A comprehensive dropdown select component built on Radix UI's Select primitive.
 * Provides single-selection functionality with keyboard navigation, grouping, and accessibility.
 *
 * Core components:
 * - Select: Root container
 * - SelectTrigger: Button that opens/closes dropdown
 * - SelectContent: Dropdown container with scroll support
 * - SelectItem: Individual selectable option
 * - SelectGroup: Groups related items with a label
 * - SelectLabel: Label for item groups
 * - SelectValue: Displays selected value or placeholder
 * - SelectSeparator: Visual divider between item groups
 * - SelectScrollUpButton: Scroll up control (auto-rendered)
 * - SelectScrollDownButton: Scroll down control (auto-rendered)
 *
 * @example
 * ```tsx
 * import {
 *   Select,
 *   SelectTrigger,
 *   SelectValue,
 *   SelectContent,
 *   SelectItem,
 *   SelectGroup,
 *   SelectLabel,
 *   SelectSeparator,
 * } from '@nasnet/ui/primitives';
 *
 * <Select>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choose an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectGroup>
 *       <SelectLabel>Fruits</SelectLabel>
 *       <SelectItem value="apple">Apple</SelectItem>
 *       <SelectItem value="banana">Banana</SelectItem>
 *     </SelectGroup>
 *     <SelectSeparator />
 *     <SelectGroup>
 *       <SelectLabel>Vegetables</SelectLabel>
 *       <SelectItem value="carrot">Carrot</SelectItem>
 *     </SelectGroup>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * @accessibility
 * - Full keyboard navigation support (Arrow keys, Enter, Escape)
 * - ARIA labels and roles automatically applied via Radix
 * - Focus management handled by Radix
 * - Screen reader friendly
 *
 * @see https://radix-ui.com/docs/primitives/components/select
 * @see ../../../DesignTokens.md for color/spacing tokens
 */
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

export type {
  SelectTriggerProps,
  SelectContentProps,
  SelectLabelProps,
  SelectItemProps,
  SelectSeparatorProps,
  SelectScrollButtonProps,
} from './select';
