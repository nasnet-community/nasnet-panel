/**
 * MangleRulesTable Storybook Stories
 *
 * Interactive stories for mangle rules table domain component.
 * Demonstrates data display, drag-drop reordering, and responsive variants.
 *
 * @module @nasnet/features/firewall
 */
import type { StoryObj } from '@storybook/react';
/**
 * MangleRulesTable - Domain component for mangle rules management
 *
 * The MangleRulesTable component provides a comprehensive interface for viewing
 * and managing MikroTik mangle rules with drag-drop reordering, inline toggles,
 * and action buttons.
 *
 * ## Features
 *
 * - **Drag-drop reordering**: Reorder rules with visual feedback using dnd-kit
 * - **Inline toggle**: Enable/disable rules without opening editor
 * - **Action buttons**: Edit, Duplicate, Delete with confirmation
 * - **Rule counters**: Packets/bytes hit counts for each rule
 * - **Disabled styling**: Visual indication for disabled rules (opacity-50)
 * - **Unused rules badge**: Highlight rules with 0 hits
 * - **Action badges**: Color-coded badges for different action types
 * - **Responsive**: Desktop table view, mobile card view
 *
 * ## Action Badge Colors
 *
 * - **mark-connection**: Blue - Traffic identification
 * - **mark-packet**: Purple - Per-packet marking
 * - **mark-routing**: Green - Policy routing
 * - **change-dscp**: Orange - QoS prioritization
 * - **change-ttl/mss**: Cyan/Pink - Advanced manipulation
 * - **accept**: Green - Terminal allow
 * - **drop**: Red - Terminal block
 * - **jump**: Indigo - Chain jumping
 * - **log**: Gray - Logging
 *
 * ## Usage
 *
 * ```tsx
 * import { MangleRulesTable } from '@nasnet/features/firewall';
 *
 * function ManglePage() {
 *   return (
 *     <div className="p-6">
 *       <h1>Mangle Rules</h1>
 *       <MangleRulesTable />
 *     </div>
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./MangleRulesTable").MangleRulesTableProps>;
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        className?: string | undefined;
        chain?: string | undefined;
    }>) => import("react/jsx-runtime").JSX.Element)[];
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
        className: {
            control: "text";
            description: string;
        };
        chain: {
            control: "text";
            description: string;
        };
    };
    args: {};
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty State
 *
 * Shows empty state message when no rules are configured.
 * Displays helpful message to guide users to create their first rule.
 */
export declare const Empty: Story;
/**
 * With Rules
 *
 * Populated table showing various rule types and configurations.
 * Demonstrates action badges, chain badges, matchers, and counters.
 */
export declare const WithRules: Story;
/**
 * Loading State
 *
 * Shows loading skeleton while fetching rules from RouterOS.
 * Displays table structure with skeleton rows.
 */
export declare const Loading: Story;
/**
 * Drag Reorder
 *
 * Demonstrates drag-and-drop reordering functionality.
 * Shows grip handle, drag preview, and position updates.
 */
export declare const DragReorder: Story;
/**
 * Mobile View
 *
 * Responsive mobile variant with card-based layout.
 * Shows rule cards instead of table, optimized for touch.
 */
export declare const MobileView: Story;
/**
 * With Disabled Rules
 *
 * Shows mix of enabled and disabled rules.
 * Disabled rules have reduced opacity and toggle is off.
 */
export declare const WithDisabledRules: Story;
/**
 * With Unused Rules
 *
 * Highlights rules with 0 packet/byte counts.
 * Shows "Unused" badge to help identify ineffective rules.
 */
export declare const WithUnusedRules: Story;
/**
 * Edit Rule Flow
 *
 * Shows edit dialog opened for a specific rule.
 * Demonstrates edit button → dialog → save flow.
 */
export declare const EditRuleFlow: Story;
/**
 * Delete Confirmation
 *
 * Shows Safety Pipeline confirmation dialog before deletion.
 * Dangerous action requires explicit confirmation.
 */
export declare const DeleteConfirmation: Story;
/**
 * Complex QoS Setup
 *
 * Real-world QoS example with VoIP prioritization.
 * Shows mark-connection → mark-packet → change-dscp flow.
 */
export declare const ComplexQoSSetup: Story;
/**
 * Multi-WAN Policy Routing
 *
 * Policy-based routing example with mark-routing.
 * Shows how to route different subnets through different WAN interfaces.
 */
export declare const MultiWANPolicyRouting: Story;
//# sourceMappingURL=MangleRulesTable.stories.d.ts.map