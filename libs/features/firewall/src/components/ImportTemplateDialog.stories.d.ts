/**
 * Storybook stories for ImportTemplateDialog
 *
 * Demonstrates the multi-step import dialog: upload (drag-and-drop or file picker),
 * validating spinner, preview with validation results and warnings, importing spinner,
 * and success completion state.
 */
import { ImportTemplateDialog } from './ImportTemplateDialog';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ImportTemplateDialog>;
export default meta;
type Story = StoryObj<typeof ImportTemplateDialog>;
/**
 * Default — dialog open on the upload step, no existing template names.
 */
export declare const Default: Story;
/**
 * With existing names — triggers conflict detection when the uploaded
 * template has a matching name.
 */
export declare const WithExistingNames: Story;
/**
 * Many existing names — a realistic fleet scenario with 10 templates already installed.
 */
export declare const ManyExistingNames: Story;
/**
 * Successful import flow — the onImport callback resolves after a short delay.
 */
export declare const WithSuccessfulImport: Story;
/**
 * Failing import — the callback rejects, surfacing a destructive Alert on the preview step.
 */
export declare const WithFailingImport: Story;
/**
 * Controlled closed state — dialog is kept closed by the parent.
 */
export declare const ControlledClosed: Story;
//# sourceMappingURL=ImportTemplateDialog.stories.d.ts.map