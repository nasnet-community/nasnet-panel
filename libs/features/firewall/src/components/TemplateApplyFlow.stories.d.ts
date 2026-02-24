/**
 * TemplateApplyFlow Storybook Stories
 *
 * Interactive stories for the XState-driven firewall template application flow.
 * Demonstrates all machine states: configuring, previewing, reviewing,
 * confirming (safety pipeline), applying, success, rolling back, rolled back, and error.
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * TemplateApplyFlow - XState-driven firewall template application wizard
 *
 * A multi-state UI that guides the user from template configuration through
 * preview, risk confirmation (safety pipeline), application, and optional rollback.
 *
 * ## Machine States
 *
 * | State | UI Shown |
 * |-------|----------|
 * | `configuring` | TemplatePreview component — fill in variables |
 * | `previewing` | Loader with "Generating preview..." message |
 * | `reviewing` | Impact analysis panel — conflicts, warnings, new rules count |
 * | `confirming` | High-risk dialog with acknowledgment checkbox (Safety Pipeline) |
 * | `applying` | Loader with "Applying template..." message |
 * | `success` | CheckCircle2 + UndoFloatingButton (5-minute rollback window) |
 * | `rollingBack` | Loader with "Rolling back..." message |
 * | `rolledBack` | CheckCircle2 with "Changes Rolled Back" message |
 * | `error` | Destructive Alert with Retry / Rollback / Cancel actions |
 *
 * ## Safety Pipeline
 *
 * The `confirming` state activates when the preview result has any of:
 * - More than 10 new rules
 * - More than 3 affected chains
 * - Any detected conflicts
 *
 * The user must check the acknowledgment checkbox before the "Apply" button enables.
 *
 * ## Rollback Window
 *
 * After successful apply, an `UndoFloatingButton` appears with a 5-minute countdown.
 * Clicking it opens a confirmation dialog before executing rollback.
 *
 * ## Usage
 *
 * ```tsx
 * import { TemplateApplyFlow } from '@nasnet/features/firewall';
 *
 * <TemplateApplyFlow
 *   routerId="192.168.88.1"
 *   template={selectedTemplate}
 *   onPreview={handlePreview}
 *   onApply={handleApply}
 *   onRollback={handleRollback}
 *   onSuccess={() => router.push('/firewall')}
 *   onCancel={() => setSelectedTemplate(null)}
 * />
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./TemplateApplyFlow").TemplateApplyFlowProps>;
    tags: string[];
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    argTypes: {
        routerId: {
            control: "text";
            description: string;
        };
        template: {
            control: false;
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Configuring State (Simple Template)
 *
 * Initial machine state — user fills in template variables.
 * The TemplatePreview component renders variable input fields.
 * Click "Preview" to advance to the reviewing state.
 */
export declare const Configuring: Story;
/**
 * Configuring State (Advanced Template)
 *
 * Expert template with 5 variables. Shows how the configuring state
 * scales to more complex templates.
 */
export declare const ConfiguringAdvancedTemplate: Story;
/**
 * Previewing State (Loading)
 *
 * The `previewing` machine state is active while onPreview is pending.
 * A centered spinner with "Generating preview..." copy is shown.
 * onPreview here hangs indefinitely to keep the UI in this state.
 */
export declare const PreviewingState: Story;
/**
 * Applying State (Loading)
 *
 * The `applying` machine state is active while onApply is pending.
 * A centered spinner with "Applying template..." copy is shown.
 * onApply here hangs indefinitely to keep the UI in this state.
 */
export declare const ApplyingState: Story;
/**
 * Null Template (Hidden State)
 *
 * When template is null, the component renders nothing.
 * This is intentional — the parent controls visibility by passing a template.
 */
export declare const NullTemplate: Story;
/**
 * With Conflict Preview Result
 *
 * After preview, the reviewing state shows the ImpactAnalysis.
 * This story simulates an onPreview that returns a conflict.
 * Click "Preview" in the configuring step to see the conflict alert.
 */
export declare const WithConflicts: Story;
/**
 * Apply Error State
 *
 * Simulates an API failure during template application.
 * After configuring and previewing, clicking Apply will show the error state
 * with a destructive Alert and Retry / Cancel actions.
 */
export declare const ApplyError: Story;
//# sourceMappingURL=TemplateApplyFlow.stories.d.ts.map