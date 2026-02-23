/**
 * DNS Diagnostics Page
 * Provides DNS lookup testing, server benchmarking, and cache management tools
 *
 * @description Allows administrators to diagnose DNS issues with lookup testing,
 * performance benchmarking, and cache management capabilities.
 */
/**
 * DnsDiagnosticsPage Component
 *
 * Composes three main diagnostic tools:
 * - DnsLookupTool: Test DNS resolution for hostnames
 * - DnsBenchmark: Compare configured DNS server performance
 * - DnsCachePanel: View cache statistics and manage DNS cache
 *
 * Layout:
 * - Desktop (lg+): 2-column grid for lookup and benchmark, full-width cache panel
 * - Mobile: Stacked single-column layout
 */
interface DnsDiagnosticsPageProps {
    /** Device ID for DNS diagnostics operations */
    deviceId?: string;
}
export declare const DnsDiagnosticsPage: import("react").NamedExoticComponent<DnsDiagnosticsPageProps>;
export {};
//# sourceMappingURL=DnsDiagnosticsPage.d.ts.map