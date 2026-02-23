/**
 * DNS Lookup Tool - Storybook Stories
 *
 * Comprehensive stories covering all DNS lookup states including:
 * - Idle state
 * - Loading state
 * - Various record types (A, MX, TXT, etc.)
 * - Error states (NXDOMAIN, TIMEOUT)
 * - Server comparison
 * - Mobile layout
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool - Task 5.9.12
 */
import { DnsLookupTool } from './DnsLookupTool';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsLookupTool>;
export default meta;
type Story = StoryObj<typeof DnsLookupTool>;
/**
 * Default idle state showing empty form ready for input
 */
export declare const Idle: Story;
/**
 * Loading state during DNS query execution
 */
export declare const Loading: Story;
/**
 * Successful A record lookup showing single IPv4 address
 */
export declare const ARecord: Story;
/**
 * Multiple A records showing load-balanced service
 */
export declare const MultipleARecords: Story;
/**
 * MX records showing mail server configuration with priority
 */
export declare const MXRecords: Story;
/**
 * TXT record showing SPF configuration
 */
export declare const TXTRecord: Story;
/**
 * NXDOMAIN error - domain does not exist
 */
export declare const NXDOMAIN: Story;
/**
 * Timeout error - DNS server not responding
 */
export declare const Timeout: Story;
/**
 * Server comparison showing side-by-side results from multiple DNS servers
 */
export declare const ServerComparison: Story;
/**
 * Mobile layout optimized for touch devices
 */
export declare const MobileLayout: Story;
//# sourceMappingURL=DnsLookupTool.stories.d.ts.map