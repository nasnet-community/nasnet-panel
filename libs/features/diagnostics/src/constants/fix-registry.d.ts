import type { FixSuggestion, DiagnosticResult } from '../types/troubleshoot.types';
/**
 * @description Registry of all known diagnostic issues and their corresponding fix suggestions.
 * Maps issue codes to fix metadata including automated commands, manual steps, and confidence levels.
 * Used by the troubleshooting machine to suggest and apply fixes based on diagnostic results.
 *
 * Organization:
 * - WAN_* issues: Physical/interface-level connectivity problems
 * - GATEWAY_* issues: Upstream router/gateway connectivity problems
 * - INTERNET_* issues: ISP-level connectivity problems (often require manual ISP intervention)
 * - DNS_* issues: Domain name resolution problems (often fixable by changing DNS servers)
 * - NAT_* issues: Network Address Translation configuration problems
 */
export declare const FIX_REGISTRY: Record<string, FixSuggestion>;
/**
 * @description Look up the appropriate fix suggestion for a diagnostic result.
 * Maps the issue code from the result to the corresponding fix in FIX_REGISTRY.
 * Returns undefined if no fix is available for the detected issue.
 *
 * @param stepId - The diagnostic step ID (unused but kept for compatibility)
 * @param result - The diagnostic result containing the issue code to look up
 * @returns FixSuggestion object or undefined if issue code not found in registry
 */
export declare function getFix(stepId: string, result: DiagnosticResult): FixSuggestion | undefined;
/**
 * @description Capture the current DNS server configuration before applying a DNS fix.
 * Enables rollback if the DNS change causes problems by storing the old configuration
 * as a RouterOS command that can be re-executed.
 *
 * @param routerId - The router UUID
 * @param executeCommand - Function to execute RouterOS commands on the router
 * @returns Promise<string | null> RouterOS command to restore old DNS config (e.g., "/ip/dns/set servers=..."), or null if capture fails
 */
export declare function storeDnsConfigForRollback(routerId: string, executeCommand: (routerId: string, command: string) => Promise<unknown>): Promise<string | null>;
//# sourceMappingURL=fix-registry.d.ts.map