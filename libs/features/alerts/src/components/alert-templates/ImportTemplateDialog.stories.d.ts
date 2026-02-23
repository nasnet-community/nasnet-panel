/**
 * ImportTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the ImportTemplateDialog component for importing
 * alert rule templates from JSON files.
 */
import { ImportTemplateDialog } from './ImportTemplateDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ImportTemplateDialog>;
export default meta;
type Story = StoryObj<typeof ImportTemplateDialog>;
/**
 * Default state showing empty dialog ready for file upload or JSON paste.
 */
export declare const Default: Story;
/**
 * Dialog with invalid JSON showing validation error.
 * Demonstrates client-side JSON parsing error.
 */
export declare const InvalidJSON: Story;
/**
 * Dialog showing successful import with valid template JSON.
 * Pre-filled with valid JSON for demonstration.
 */
export declare const Success: Story;
//# sourceMappingURL=ImportTemplateDialog.stories.d.ts.map