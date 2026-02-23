/**
 * Storybook stories for DnsServerComparison
 *
 * Covers: empty state, single server, multiple servers (fastest badge),
 * error state, discrepancy warning, and mixed results.
 */
import { DnsServerComparison } from './DnsServerComparison';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsServerComparison>;
export default meta;
type Story = StoryObj<typeof DnsServerComparison>;
export declare const Empty: Story;
export declare const SingleServer: Story;
export declare const TwoServersComparison: Story;
export declare const MultipleServers: Story;
export declare const WithErrors: Story;
export declare const DiscrepancyWarning: Story;
//# sourceMappingURL=DnsServerComparison.stories.d.ts.map