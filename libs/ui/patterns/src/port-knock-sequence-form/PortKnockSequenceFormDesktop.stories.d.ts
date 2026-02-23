/**
 * PortKnockSequenceFormDesktop Stories
 *
 * Storybook stories for the Desktop platform presenter of the port knock sequence form.
 * Demonstrates two-column layout, drag-drop reordering, SSH lockout warnings,
 * and all operational states.
 *
 * Story: NAS-7.12 - Implement Port Knocking - Task 9
 * @module @nasnet/ui/patterns/port-knock-sequence-form
 */
import type { PortKnockSequenceInput } from '@nasnet/core/types';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * Wrapper that wires up the headless hook before rendering the desktop presenter.
 *
 * PortKnockSequenceFormDesktop expects a pre-built `formState` from
 * `usePortKnockSequenceForm`, so we need a thin wrapper to satisfy that
 * contract in stories.
 */
declare function DesktopStoryWrapper({ initialValues, isEditMode, isSubmitting, }: {
    initialValues?: PortKnockSequenceInput;
    isEditMode?: boolean;
    isSubmitting?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * PortKnockSequenceFormDesktop
 *
 * Desktop layout for configuring a port knocking sequence. Renders a two-column
 * grid: the left column contains the form (sequence name, drag-drop knock ports
 * table, protected service, and timeouts) while the right column shows a live
 * `PortKnockVisualizer` preview and the generated firewall rules.
 *
 * - **Drag and drop**: Knock ports can be reordered with pointer or keyboard
 * - **SSH lockout detection**: Shows a destructive alert when port 22 is protected
 * - **Max 8 ports**: Add button is disabled when the maximum is reached
 * - **Min 2 ports**: Remove button is disabled when only two ports remain
 */
declare const meta: Meta<typeof DesktopStoryWrapper>;
export default meta;
type Story = StoryObj<typeof DesktopStoryWrapper>;
/**
 * Default - empty create form
 *
 * Empty desktop form ready for a brand-new knock sequence. The visualizer on the
 * right starts empty until the user adds at least two knock ports.
 */
export declare const Default: Story;
/**
 * Edit Existing Sequence - SSH Protection
 *
 * Pre-populated form for editing an existing three-knock SSH protection sequence.
 * The SSH lockout warning is visible because the protected port is 22.
 */
export declare const EditSSHProtection: Story;
/**
 * RDP Protection - No Lockout Warning
 *
 * A four-knock sequence protecting Remote Desktop (port 3389).
 * No SSH lockout warning is shown because port 22 is not involved.
 */
export declare const RDPProtection: Story;
/**
 * Maximum Knock Ports (8)
 *
 * A high-security sequence with the maximum of eight knock ports configured.
 * The Add button in the table header is disabled.
 */
export declare const MaximumPorts: Story;
/**
 * Mixed Protocols
 *
 * Demonstrates a sequence that alternates between TCP and UDP knock ports.
 * This is a common pattern for adding extra complexity to the sequence.
 */
export declare const MixedProtocols: Story;
/**
 * Submitting State
 *
 * The Save button shows a "Saving..." label and is disabled while a submission
 * is in progress. All other inputs remain interactive.
 */
export declare const SubmittingState: Story;
//# sourceMappingURL=PortKnockSequenceFormDesktop.stories.d.ts.map