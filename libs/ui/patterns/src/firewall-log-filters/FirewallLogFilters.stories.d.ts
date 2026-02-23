/**
 * Storybook Stories for FirewallLogFilters
 *
 * Demonstrates various states and configurations of the firewall log filters component.
 *
 * @see NAS-7.9: Implement Firewall Logging
 */
import { FirewallLogFilters } from './FirewallLogFilters';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FirewallLogFilters>;
export default meta;
type Story = StoryObj<typeof FirewallLogFilters>;
/**
 * Default state with no active filters.
 */
export declare const Default: Story;
/**
 * Desktop view with sidebar layout.
 */
export declare const Desktop: Story;
/**
 * Mobile view with bottom sheet.
 */
export declare const Mobile: Story;
/**
 * With active filters showing badge and Clear button.
 */
export declare const WithActiveFilters: Story;
/**
 * With available prefixes for autocomplete dropdown.
 */
export declare const WithPrefixAutocomplete: Story;
/**
 * With complex filters demonstrating wildcard IP and port ranges.
 */
export declare const ComplexFilters: Story;
/**
 * Test: User can toggle action filters
 */
export declare const InteractionToggleActions: Story;
/**
 * Test: User can enter wildcard IP addresses
 */
export declare const InteractionWildcardIP: Story;
/**
 * Test: User can clear all filters
 */
export declare const InteractionClearFilters: Story;
//# sourceMappingURL=FirewallLogFilters.stories.d.ts.map