/**
 * MangleRuleEditorDesktop Stories
 *
 * Storybook stories for the Desktop platform presenter of the MangleRuleEditor.
 * Demonstrates dialog-based form layout, action-specific field groups,
 * live preview panel, and all operational states.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */
import { MangleRuleEditorDesktop } from './MangleRuleEditorDesktop';
import type { Meta, StoryObj } from '@storybook/react';
/**
 * MangleRuleEditorDesktop - Dialog-based mangle rule editor for Desktop
 *
 * The desktop presenter renders a wide Dialog with an inline two-column form and
 * a live preview panel. It is optimised for keyboard navigation and dense data entry.
 *
 * ## Features
 *
 * - **Live preview**: Human-readable rule description regenerated on every keystroke
 * - **Action-specific fields**: Shows only the fields relevant to the chosen action
 * - **DSCP selector**: Annotated QoS class list for `change-dscp` action
 * - **Traffic matchers**: Protocol, connection state, src/dst address, src/dst port
 * - **Dangerous-action guard**: Delete button is only shown in edit mode
 * - **Accessibility**: WCAG AAA, full keyboard navigation, aria-busy on submit
 *
 * ## Action Types
 *
 * | Action | Extra fields |
 * |--------|-------------|
 * | `mark-connection` | newConnectionMark, passthrough |
 * | `mark-packet`     | newPacketMark, passthrough |
 * | `mark-routing`    | newRoutingMark, passthrough |
 * | `change-dscp`     | newDscp |
 * | `accept` / `drop` | (none) |
 */
declare const meta: Meta<typeof MangleRuleEditorDesktop>;
export default meta;
type Story = StoryObj<typeof MangleRuleEditorDesktop>;
/**
 * Default - empty create form
 *
 * Empty form ready for a new mangle rule. Chain and action selectors are unset;
 * the live preview displays a placeholder until the user makes a selection.
 */
export declare const Default: Story;
/**
 * Mark Connection Rule
 *
 * Pre-populated rule that marks all packets belonging to a TCP connection.
 * Shows newConnectionMark and passthrough fields specific to mark-connection action.
 */
export declare const MarkConnectionRule: Story;
/**
 * Mark Routing Rule
 *
 * Policy routing rule that directs a source subnet through a secondary WAN interface.
 * Shows newRoutingMark field and source address matcher.
 */
export declare const MarkRoutingRule: Story;
/**
 * Change DSCP Rule
 *
 * Sets the Differentiated Services Code Point for VoIP signalling traffic.
 * Shows the annotated DSCP class selector with QoS descriptions.
 */
export declare const ChangeDscpRule: Story;
/**
 * Edit Existing Rule
 *
 * Editor opened against an existing rule (id present). The Delete button appears
 * in the footer and all fields are pre-populated with current values.
 */
export declare const EditExistingRule: Story;
/**
 * Saving State
 *
 * The Save button shows a loading indicator and is disabled while isSaving is true.
 * The Cancel and Delete buttons are also disabled to prevent concurrent actions.
 */
export declare const SavingState: Story;
/**
 * Deleting State
 *
 * The Delete button shows a loading indicator. Applies only in edit mode when
 * a deletion request is in flight.
 */
export declare const DeletingState: Story;
//# sourceMappingURL=MangleRuleEditorDesktop.stories.d.ts.map