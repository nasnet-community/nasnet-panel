/**
 * Textarea Component Stories
 *
 * Comprehensive Storybook stories for the Textarea primitive component.
 * Covers all platform viewports (Mobile/Tablet/Desktop), states (default/loading/error/empty),
 * and accessibility requirements (WCAG AAA).
 *
 * @see {@link ./textarea.tsx} For component implementation
 * @see {@link ../../Docs/design/ux-design/6-component-library.md} For component library guidelines
 * @see {@link ../../Docs/design/DESIGN_TOKENS.md} For design token reference
 */
import { Textarea } from './textarea';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof Textarea>;
export declare const Default: Story;
export declare const WithValue: Story;
export declare const Disabled: Story;
export declare const ReadOnly: Story;
export declare const WithLabel: Story;
export declare const WithError: Story;
export declare const Mobile: Story;
export declare const Tablet: Story;
export declare const Desktop: Story;
export declare const Empty: Story;
export declare const Loading: Story;
export declare const WithKeyboardSupport: Story;
//# sourceMappingURL=textarea.stories.d.ts.map