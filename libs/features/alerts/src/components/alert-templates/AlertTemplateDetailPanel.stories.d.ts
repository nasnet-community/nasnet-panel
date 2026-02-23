/**
 * AlertTemplateDetailPanel Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases all states of the AlertTemplateDetailPanel component:
 * - Built-in template with variables (tabbed layout)
 * - Built-in template without variables (single-view layout)
 * - Custom (user-created) template with Delete action
 * - Submitting state (disabled actions)
 * - Security / VPN / Resource category templates
 */
import { AlertTemplateDetailPanel } from './AlertTemplateDetailPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AlertTemplateDetailPanel>;
export default meta;
type Story = StoryObj<typeof AlertTemplateDetailPanel>;
/**
 * Built-in network template that has variables — shows the tabbed layout
 * with a Details tab and a Configure tab containing the variable input form.
 */
export declare const WithVariables: Story;
/**
 * Built-in template with no variables — shows the flat single-view layout
 * with a direct Apply Template button.
 */
export declare const NoVariables: Story;
/**
 * Security category template with multiple variables and throttle config.
 */
export declare const SecurityTemplate: Story;
/**
 * Resources category template with a percentage variable.
 */
export declare const ResourcesTemplate: Story;
/**
 * Custom (user-created) template — shows the Delete button alongside Export.
 * The Delete button is hidden for built-in templates.
 */
export declare const CustomTemplateWithDelete: Story;
/**
 * Submitting state — all action buttons are disabled and the Apply button
 * shows "Applying..." text.
 */
export declare const Submitting: Story;
//# sourceMappingURL=AlertTemplateDetailPanel.stories.d.ts.map