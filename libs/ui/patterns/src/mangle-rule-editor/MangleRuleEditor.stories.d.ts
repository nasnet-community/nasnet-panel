/**
 * MangleRuleEditor Storybook Stories
 *
 * Interactive stories for mangle rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/mangle-rule-editor
 */
import type { StoryObj } from '@storybook/react';
/**
 * MangleRuleEditor - Mangle rule creation and editing dialog
 *
 * The MangleRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik mangle rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **Mark name validation**: Enforces alphanumeric/underscore/hyphen, max 63 chars
 * - **DSCP selector**: QoS class descriptions for change-dscp action
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **mark-connection**: Mark all packets in a connection (for QoS queue trees)
 * - **mark-packet**: Mark individual packets (for per-packet queuing)
 * - **mark-routing**: Mark for routing decisions (policy routing, multi-WAN)
 * - **change-dscp**: Set DSCP QoS priority (VoIP, video, etc.)
 * - **change-ttl**: Modify Time To Live
 * - **change-mss**: Clamp Maximum Segment Size
 * - **jump**: Jump to another chain
 * - **log**: Log packet with prefix
 * - **accept**: Accept packet (terminal)
 * - **drop**: Drop packet (terminal)
 *
 * ## Usage
 *
 * ```tsx
 * import { MangleRuleEditor } from '@nasnet/ui/patterns/mangle-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <MangleRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createMangleRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./mangle-rule-editor.types").MangleRuleEditorProps>;
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
    tags: string[];
    argTypes: {
        routerId: {
            control: "text";
            description: string;
        };
        open: {
            control: "boolean";
            description: string;
        };
        mode: {
            control: "select";
            options: string[];
            description: string;
        };
        isSaving: {
            control: "boolean";
            description: string;
        };
        isDeleting: {
            control: "boolean";
            description: string;
        };
        showChainDiagram: {
            control: "boolean";
            description: string;
        };
        onClose: {
            action: string;
        };
        onSave: {
            action: string;
        };
        onDelete: {
            action: string;
        };
    };
    args: {
        routerId: string;
        open: true;
        onClose: import("storybook/test").Mock<(...args: any[]) => any>;
        onSave: import("storybook/test").Mock<(...args: any[]) => any>;
        isSaving: false;
        mode: "create";
        showChainDiagram: true;
        addressLists: string[];
        interfaceLists: string[];
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Create Mark Connection Rule
 *
 * Mark all packets in a connection for QoS queue trees.
 * Useful for: Traffic shaping, bandwidth management, prioritization.
 */
export declare const CreateMarkConnection: Story;
/**
 * Create Mark Packet Rule
 *
 * Mark individual packets for per-packet queue assignment.
 * Useful for: Per-packet traffic shaping, advanced QoS.
 */
export declare const CreateMarkPacket: Story;
/**
 * Create Mark Routing Rule
 *
 * Mark packets for policy-based routing decisions.
 * Useful for: Multi-WAN failover, VRF, policy routing.
 */
export declare const CreateMarkRouting: Story;
/**
 * Create Change DSCP Rule
 *
 * Set DSCP (Differentiated Services Code Point) for QoS prioritization.
 * Shows DSCP selector with standard QoS classes (EF, AF, CS).
 */
export declare const CreateChangeDscp: Story;
/**
 * Edit Existing Rule
 *
 * Edit mode with pre-populated form data.
 * Shows delete button and rule ID.
 */
export declare const EditExisting: Story;
/**
 * With Validation Errors
 *
 * Shows form validation feedback for invalid inputs.
 * Invalid mark name (contains spaces and special characters).
 */
export declare const WithErrors: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (Sheet instead of Dialog).
 * Card-based form sections, 44px touch targets, bottom action buttons.
 */
export declare const MobileVariant: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (Dialog).
 * Inline form layout, live preview panel, dense data entry.
 */
export declare const DesktopVariant: Story;
/**
 * Saving State
 *
 * Shows loading state when save operation is in progress.
 * Save button is disabled and shows loading spinner.
 */
export declare const SavingState: Story;
/**
 * Deleting State
 *
 * Shows loading state when delete operation is in progress.
 * Delete button is disabled and shows loading spinner.
 */
export declare const DeletingState: Story;
/**
 * Complex Rule with All Matchers
 *
 * Shows a rule with many matchers configured.
 * Demonstrates comprehensive matching capabilities.
 */
export declare const ComplexRule: Story;
//# sourceMappingURL=MangleRuleEditor.stories.d.ts.map