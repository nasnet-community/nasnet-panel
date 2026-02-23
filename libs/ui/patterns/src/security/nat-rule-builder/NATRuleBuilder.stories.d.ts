/**
 * NAT Rule Builder Storybook Stories
 *
 * Visual regression testing and documentation for NAT rule builder component.
 *
 * @module @nasnet/ui/patterns/security/nat-rule-builder
 */
import { NATRuleBuilder } from './NATRuleBuilder';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NATRuleBuilder>;
export default meta;
type Story = StoryObj<typeof NATRuleBuilder>;
/**
 * Story 1: Create Masquerade Rule (Most Common)
 */
export declare const CreateMasquerade: Story;
/**
 * Story 2: Create Port Forward (dst-nat)
 */
export declare const CreatePortForward: Story;
/**
 * Story 3: Edit Existing Rule
 */
export declare const EditExistingRule: Story;
/**
 * Story 4: Redirect to Router
 */
export declare const CreateRedirect: Story;
/**
 * Story 5: 1:1 NAT (netmap)
 */
export declare const CreateNetmap: Story;
/**
 * Story 6: Empty State (Create New)
 */
export declare const EmptyState: Story;
/**
 * Story 7: Loading States
 */
export declare const LoadingStates: Story;
/**
 * Story 8: With Logging Enabled
 */
export declare const WithLogging: Story;
//# sourceMappingURL=NATRuleBuilder.stories.d.ts.map