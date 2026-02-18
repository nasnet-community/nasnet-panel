/**
 * DNS Diagnostics Page
 * Provides DNS lookup testing, server benchmarking, and cache management tools
 */

import { DnsLookupTool } from '@nasnet/features/diagnostics';
import { DnsBenchmark } from '../components/DnsBenchmark';
import { DnsCachePanel } from '../components/DnsCachePanel';

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
  deviceId?: string;
}

export function DnsDiagnosticsPage({ deviceId = 'default' }: DnsDiagnosticsPageProps) {
  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* Page Header with category accent */}
      <div className="border-l-4 border-category-networking pl-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Network</span>
          <span>/</span>
          <span>DNS</span>
          <span>/</span>
          <span className="text-foreground">Diagnostics</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">DNS Diagnostics</h1>
        <p className="text-muted-foreground mt-1">
          Test DNS resolution, benchmark server performance, and manage DNS cache
        </p>
      </div>

      {/* Diagnostic Tools Grid - 2 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DNS Lookup Tool */}
        <DnsLookupTool deviceId={deviceId} />

        {/* DNS Server Benchmark */}
        <DnsBenchmark deviceId={deviceId} />
      </div>

      {/* DNS Cache Management - Full width */}
      <DnsCachePanel deviceId={deviceId} />
    </div>
  );
}
