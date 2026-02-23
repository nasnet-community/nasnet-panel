/**
 * ExportTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the ExportTemplateDialog component for exporting
 * alert rule templates as JSON files.
 */
import { ExportTemplateDialog } from './ExportTemplateDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ExportTemplateDialog>;
export default meta;
type Story = StoryObj<typeof ExportTemplateDialog>;
/**
 * Default state showing exported template JSON with copy and download buttons.
 */
export declare const Default: Story;
/**
 * Loading state when fetching template JSON from server.
 * Shows "Loading..." in the textarea.
 */
export declare const Loading: Story;
/**
 * Dialog with simpler template (fewer fields, no variables).
 * Demonstrates cleaner JSON export.
 */
export declare const SimpleTemplate: Story;
//# sourceMappingURL=ExportTemplateDialog.stories.d.ts.map