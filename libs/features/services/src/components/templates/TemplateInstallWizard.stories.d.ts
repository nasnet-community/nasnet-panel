/**
 * Storybook stories for TemplateInstallWizard
 *
 * Platform wrapper that routes to Mobile or Desktop presenter.
 * Supports a multi-step installation flow: Variables → Review → Installing → Routing.
 */
import { TemplateInstallWizard } from './TemplateInstallWizard';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof TemplateInstallWizard>;
export default meta;
type Story = StoryObj<typeof TemplateInstallWizard>;
/**
 * Default wizard open with a simple single-service template.
 * Shows the Variables step (Step 1) as the initial state.
 */
export declare const DefaultOpen: Story;
/**
 * Wizard with a multi-service chained template (Xray + Tor).
 * Demonstrates multiple services with dependencies and prerequisites.
 */
export declare const MultiServiceChain: Story;
/**
 * Wizard displaying a template that has prerequisites listed.
 * Ensures the prerequisites warning card is visible during Review step.
 */
export declare const WithPrerequisites: Story;
/**
 * Wizard in closed state. Useful for testing the closed/hidden rendering.
 */
export declare const Closed: Story;
/**
 * A large enterprise template with many config variables to test
 * scrollable content areas and long variable lists.
 */
export declare const LargeTemplate: Story;
/**
 * Wizard without an onComplete callback — useful for testing flows
 * where the parent page doesn't need to react to completion.
 */
export declare const NoCompletionCallback: Story;
//# sourceMappingURL=TemplateInstallWizard.stories.d.ts.map