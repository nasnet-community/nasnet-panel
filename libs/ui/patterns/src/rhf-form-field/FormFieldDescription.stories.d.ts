/**
 * FormFieldDescription Stories
 *
 * Storybook stories for the FormFieldDescription component.
 * Demonstrates text-only and icon-augmented variants, custom styling,
 * and real-world usage inside a labelled form field.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import { FormFieldDescription } from './FormFieldDescription';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * FormFieldDescription
 *
 * A lightweight help-text element that sits below a form field label or input.
 * Linked to its target input via `aria-describedby` for screen reader support.
 *
 * ## Features
 *
 * - Renders as a `<p>` tag with `role` semantics for accessibility
 * - Optional `id` prop to satisfy `aria-describedby` from the sibling input
 * - Optional `showIcon` prop renders a HelpCircle icon before the text
 * - Fully composable: accepts any `ReactNode` as children
 *
 * ## Usage
 *
 * ```tsx
 * <label htmlFor="ip-address">IP Address</label>
 * <input id="ip-address" aria-describedby="ip-address-desc" />
 * <FormFieldDescription id="ip-address-desc">
 *   Enter the IP address in CIDR notation, e.g. 192.168.1.1/24
 * </FormFieldDescription>
 * ```
 */
declare const meta: Meta<typeof FormFieldDescription>;
export default meta;
type Story = StoryObj<typeof FormFieldDescription>;
/**
 * Default
 *
 * Plain help text without an icon. The most common use case for short,
 * self-explanatory field descriptions.
 */
export declare const Default: Story;
/**
 * With Help Icon
 *
 * Adds a HelpCircle icon to the left of the text to draw attention to
 * descriptions that contain important information or caveats.
 */
export declare const WithHelpIcon: Story;
/**
 * Technical Description
 *
 * Longer description with inline code-style formatting wrapped in a `<code>`
 * element. The component renders any ReactNode as children so rich content
 * is fully supported.
 */
export declare const TechnicalDescription: Story;
/**
 * With Aria ID
 *
 * Demonstrates `id` prop usage. The description paragraph receives an `id` so
 * the sibling input can reference it via `aria-describedby`. Inspect the DOM
 * to verify the id attribute is present.
 */
export declare const WithAriaId: Story;
/**
 * Short Description
 *
 * Very brief one-line descriptions are the most common use case.
 */
export declare const ShortDescription: Story;
/**
 * Custom Class
 *
 * Demonstrates `className` customisation. Here a warning colour is applied
 * to highlight that the field has a destructive impact.
 */
export declare const CustomClass: Story;
//# sourceMappingURL=FormFieldDescription.stories.d.ts.map