/**
 * Storybook stories for DnsResults
 *
 * Demonstrates the DNS results table component across all major
 * record types, authority levels, and query-time color states.
 */
import { DnsResults } from './DnsResults';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsResults>;
export default meta;
type Story = StoryObj<typeof DnsResults>;
/**
 * A Record — Single IPv4 Address
 *
 * The simplest and most common DNS query. Shows one A record with a fast
 * query time (green) and no authority badge.
 */
export declare const ARecord: Story;
/**
 * Multiple A Records (Load Balanced)
 *
 * A hostname that resolves to several IPs, typical for large-scale services.
 * Demonstrates how multiple rows render in the table.
 */
export declare const MultipleARecords: Story;
/**
 * MX Records (Sorted by Priority)
 *
 * Mail exchange records automatically sorted by ascending priority.
 * Demonstrates the priority-sort behaviour for MX types.
 */
export declare const MXRecords: Story;
/**
 * TXT Record (SPF)
 *
 * A TXT record containing an SPF policy string — common DNS verification use case.
 */
export declare const TXTRecord: Story;
/**
 * Authoritative Response
 *
 * Shows the "Authoritative" badge in the metadata header when the responding
 * server is the authoritative nameserver for the domain.
 */
export declare const AuthoritativeResponse: Story;
/**
 * Slow Query Time
 *
 * Query time of 350ms triggers the error color (red) in the metadata header,
 * alerting the user that the DNS server is responding slowly.
 */
export declare const SlowQueryTime: Story;
/**
 * No Records Found
 *
 * A successful response that returned zero records (rare but valid).
 * Shows the "No records found" empty state inside the table area.
 */
export declare const NoRecordsFound: Story;
//# sourceMappingURL=DnsResults.stories.d.ts.map