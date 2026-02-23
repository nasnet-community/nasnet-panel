import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
/**
 * Props for the RadioGroup component.
 * Extends Radix UI RadioGroupPrimitive.Root component props.
 * @interface RadioGroupProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 * @property {string} [value] - The value of the radio item that should be checked
 * @property {function} [onValueChange] - Callback fired when the value changes
 * @property {string} [defaultValue] - The value of the radio item that should be checked by default
 * @property {boolean} [disabled] - When true, prevents the user from interacting with radio items
 * @property {"vertical" | "horizontal"} [orientation] - The orientation of the component
 */
export interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
}
/**
 * Props for the RadioGroupItem component.
 * Extends Radix UI RadioGroupPrimitive.Item component props.
 * @interface RadioGroupItemProps
 * @property {string} value - The value given as data when submitted with a name
 * @property {string} [className] - Additional CSS classes to merge with component styles
 * @property {boolean} [disabled] - When true, prevents the user from interacting with the radio item
 */
export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
}
/**
 * A set of checkable buttons where only one can be selected at a time.
 * Built on Radix UI RadioGroup with keyboard navigation and semantic styling.
 * Use with RadioGroupItem for each option.
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option1">
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="option1" id="option1" />
 *     <Label htmlFor="option1">Option 1</Label>
 *   </div>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="option2" id="option2" />
 *     <Label htmlFor="option2">Option 2</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
declare const RadioGroup: React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>;
/**
 * An individual radio button item within a RadioGroup.
 * Must be used inside a RadioGroup component.
 * Renders a 20px × 20px radio button with custom styling and WCAG AAA compliance.
 *
 * @example
 * ```tsx
 * <RadioGroupItem value="example" id="example-id" />
 * ```
 *
 * @see RadioGroup - Use as a child of RadioGroup
 * @see https://www.radix-ui.com/docs/primitives/components/radio-group - Radix UI RadioGroup docs
 */
declare const RadioGroupItem: React.ForwardRefExoticComponent<RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>>;
export { RadioGroup, RadioGroupItem };
//# sourceMappingURL=radio-group.d.ts.map