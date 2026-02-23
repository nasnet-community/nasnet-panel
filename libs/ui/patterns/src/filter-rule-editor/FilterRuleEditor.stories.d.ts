/**
 * FilterRuleEditor Storybook Stories
 *
 * Interactive stories for filter rule editor pattern component.
 * Demonstrates all action types, validation states, and platform variants.
 *
 * @module @nasnet/ui/patterns/filter-rule-editor
 */
import type { StoryObj } from '@storybook/react';
/**
 * FilterRuleEditor - Filter rule creation and editing dialog
 *
 * The FilterRuleEditor component provides a comprehensive form for creating and editing
 * MikroTik firewall filter rules. It automatically adapts to platform (mobile/tablet/desktop)
 * and shows/hides fields based on the selected action type.
 *
 * ## Features
 *
 * - **Action-specific fields**: Only shows relevant fields for each action type
 * - **Live preview**: Human-readable rule description updates as you type
 * - **IP/Port validation**: Enforces valid IP addresses (CIDR) and port ranges
 * - **Connection state selector**: Filter by established, related, new, invalid, untracked
 * - **Chain-specific constraints**: Input chain disallows outInterface, output disallows inInterface
 * - **Platform adaptive**: Desktop dialog vs mobile sheet
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Action Types
 *
 * - **accept**: Allow packet through (terminal)
 * - **drop**: Silently discard packet (terminal)
 * - **reject**: Discard and send ICMP error (terminal)
 * - **log**: Log packet and continue processing
 * - **jump**: Jump to custom chain
 * - **tarpit**: Capture and hold connection (anti-DDoS)
 * - **passthrough**: Continue to next rule
 *
 * ## Chains
 *
 * - **input**: Packets destined for the router itself
 * - **forward**: Packets passing through the router
 * - **output**: Packets originating from the router
 *
 * ## Usage
 *
 * ```tsx
 * import { FilterRuleEditor } from '@nasnet/ui/patterns/filter-rule-editor';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <FilterRuleEditor
 *       routerId="router-123"
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       onSave={async (rule) => {
 *         await createFilterRule({ routerId, rule });
 *       }}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./filter-rule-editor.types").FilterRuleEditorProps>;
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
 * Create Accept Rule
 *
 * Allow SSH connections from trusted network.
 * Useful for: Remote administration, trusted access.
 */
export declare const CreateAcceptRule: Story;
/**
 * Create Drop Rule
 *
 * Silently drop all traffic from blacklisted IPs.
 * Useful for: Blocking attackers, blacklist enforcement.
 */
export declare const CreateDropRule: Story;
/**
 * Create Reject Rule
 *
 * Reject telnet connections with ICMP error.
 * Useful for: Blocking insecure protocols, policy enforcement.
 */
export declare const CreateRejectRule: Story;
/**
 * Create Log Rule
 *
 * Log all dropped packets for security analysis.
 * Useful for: Security auditing, intrusion detection, troubleshooting.
 */
export declare const CreateLogRule: Story;
/**
 * Create Jump Rule
 *
 * Jump to custom chain for advanced filtering.
 * Useful for: Organizing complex rulesets, reusable rule groups.
 */
export declare const CreateJumpRule: Story;
/**
 * Create Tarpit Rule (Anti-DDoS)
 *
 * Capture and hold malicious connection attempts.
 * Useful for: DDoS mitigation, rate limiting, slowing down attackers.
 */
export declare const CreateTarpitRule: Story;
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
 * Missing required log prefix for log action.
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
/**
 * Chain-Specific Constraint: Input Chain
 *
 * Input chain disallows outInterface (no routing decision yet).
 * Only inInterface is allowed.
 */
export declare const InputChainConstraint: Story;
/**
 * Chain-Specific Constraint: Output Chain
 *
 * Output chain disallows inInterface (packets originate from router).
 * Only outInterface is allowed.
 */
export declare const OutputChainConstraint: Story;
//# sourceMappingURL=FilterRuleEditor.stories.d.ts.map