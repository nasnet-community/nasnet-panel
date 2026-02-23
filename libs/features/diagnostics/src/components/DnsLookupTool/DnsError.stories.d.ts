/**
 * Storybook stories for DnsError
 *
 * Demonstrates all DNS error status variants supported by the DnsError component:
 * NXDOMAIN, SERVFAIL, TIMEOUT, REFUSED, and NETWORK_ERROR.
 * Each story also verifies that query details (hostname, record type, server, status)
 * are shown in the lower metadata panel.
 */
import { DnsError } from './DnsError';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DnsError>;
export default meta;
type Story = StoryObj<typeof DnsError>;
/**
 * NXDOMAIN — Domain Does Not Exist
 *
 * The most common DNS error. The domain is not registered or was misspelled.
 * Suggestion: double-check spelling or verify registration.
 */
export declare const NXDOMAIN: Story;
/**
 * SERVFAIL — Server Failure
 *
 * The DNS server encountered an internal error while processing the query.
 * Suggestion: retry or switch to a different DNS server.
 */
export declare const SERVFAIL: Story;
/**
 * TIMEOUT — No Response Within Limit
 *
 * The DNS server did not respond within the configured timeout window.
 * Suggestion: increase the timeout or try a different server.
 */
export declare const Timeout: Story;
/**
 * REFUSED — Query Rejected by Server
 *
 * The DNS server actively refused to answer the query (e.g., due to access
 * control lists or policy restrictions).
 * Suggestion: the server may have query restrictions configured.
 */
export declare const Refused: Story;
/**
 * NETWORK_ERROR — No Connectivity to DNS Server
 *
 * The router could not reach the DNS server at the network layer.
 * Suggestion: check router connectivity and network configuration.
 */
export declare const NetworkError: Story;
/**
 * MX Record NXDOMAIN
 *
 * Error state for a non-A record type to confirm query metadata
 * (hostname, record type, server) renders correctly for all record types.
 */
export declare const MXRecordNXDOMAIN: Story;
//# sourceMappingURL=DnsError.stories.d.ts.map