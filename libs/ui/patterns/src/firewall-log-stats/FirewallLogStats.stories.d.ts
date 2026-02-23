/**
 * FirewallLogStats Storybook Stories
 *
 * Demonstrates FirewallLogStats component variants and use cases.
 */
import { FirewallLogStats } from './FirewallLogStats';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FirewallLogStats>;
export default meta;
type Story = StoryObj<typeof FirewallLogStats>;
/**
 * Default state with realistic mixed traffic
 */
export declare const Default: Story;
/**
 * Empty state with no logs
 */
export declare const Empty: Story;
/**
 * Loading state
 */
export declare const Loading: Story;
/**
 * Heavily blocked traffic scenario (DDoS/attack pattern)
 */
export declare const HeavyBlockedTraffic: Story;
/**
 * Port scan attack pattern
 */
export declare const PortScanPattern: Story;
/**
 * Without blocklist callback (read-only mode)
 */
export declare const WithoutBlocklistAction: Story;
/**
 * Mostly accepted traffic (healthy network)
 */
export declare const HealthyTraffic: Story;
/**
 * Large dataset (1000+ logs)
 */
export declare const LargeDataset: Story;
/**
 * Single blocked IP dominating
 */
export declare const SingleAttacker: Story;
/**
 * Database server traffic pattern
 */
export declare const DatabaseServerTraffic: Story;
/**
 * Web server traffic pattern
 */
export declare const WebServerTraffic: Story;
//# sourceMappingURL=FirewallLogStats.stories.d.ts.map