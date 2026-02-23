/**
 * RawRuleEditor Storybook Stories
 *
 * Interactive stories for RAW rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/raw-rule-editor
 */
import type { StoryObj } from '@storybook/react';
/**
 * RawRuleEditor - RAW rule creation and editing dialog
 *
 * The RawRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik RAW firewall rules. RAW rules execute BEFORE connection tracking for
 * performance optimization and early packet dropping.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **Performance tips**: Shows optimization hints for notrack action
 * - **IP/Port validation**: Enforces valid IP addresses (CIDR) and port ranges
 * - **Chain-specific constraints**: Prerouting allows inInterface, output allows outInterface
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **accept**: Allow packet (continue to filter rules)
 * - **drop**: Silently discard packet (terminal)
 * - **notrack**: Disable connection tracking (performance optimization)
 * - **log**: Log packet and continue processing
 * - **jump**: Jump to custom chain
 *
 * ## Chains
 *
 * - **prerouting**: Before routing decision (allows inInterface)
 * - **output**: Packets originating from router (allows outInterface)
 *
 * ## Usage
 *
 * ```tsx
 * import { RawRuleEditor } from '@nasnet/ui/patterns/raw-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <RawRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createRawRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./raw-rule-editor.types").RawRuleEditorProps>;
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
            control: "radio";
            options: string[];
            description: string;
        };
        showPerformanceTips: {
            control: "boolean";
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
    };
    args: {
        routerId: string;
        open: true;
        onClose: import("storybook/test").Mock<(...args: any[]) => any>;
        onSave: import("storybook/test").Mock<(...args: any[]) => any>;
        onDelete: import("storybook/test").Mock<(...args: any[]) => any>;
        showPerformanceTips: true;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default create mode with notrack action.
 * Shows performance tip about bypassing connection tracking.
 */
export declare const Default: Story;
/**
 * Edit mode with existing rule.
 * Shows all fields populated with current rule values.
 */
export declare const EditMode: Story;
/**
 * Drop action for early packet dropping.
 * Used for DDoS mitigation and bogon filtering.
 */
export declare const DropAction: Story;
/**
 * Notrack action for performance optimization.
 * Shows performance tip explaining connection tracking bypass.
 */
export declare const NotrackAction: Story;
/**
 * Log action with log prefix field.
 * Shows suggested log prefixes for quick selection.
 */
export declare const LogAction: Story;
/**
 * Jump action with custom chain target.
 * Shows jumpTarget field for chain name.
 */
export declare const JumpAction: Story;
/**
 * Accept action to allow packet through.
 * Packet continues to filter rules for further processing.
 */
export declare const AcceptAction: Story;
/**
 * Complex rule with multiple matchers.
 * Shows protocol, addresses, ports, and interface.
 */
export declare const ComplexRule: Story;
/**
 * Saving state with disabled interactions.
 * All buttons disabled during save operation.
 */
export declare const SavingState: Story;
/**
 * Deleting state with disabled interactions.
 * All buttons disabled during delete operation.
 */
export declare const DeletingState: Story;
/**
 * Validation errors state.
 * Shows inline validation errors for invalid fields.
 */
export declare const ValidationErrors: Story;
/**
 * Mobile view (Sheet presentation).
 * Card-based layout with 44px touch targets.
 */
export declare const MobileView: Story;
//# sourceMappingURL=RawRuleEditor.stories.d.ts.map