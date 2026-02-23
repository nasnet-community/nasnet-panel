/**
 * DNS Lookup Tool Route
 *
 * Provides DNS lookup diagnostic functionality allowing users to:
 * - Query DNS records (A, AAAA, MX, TXT, CNAME, NS, PTR, SOA, SRV)
 * - Compare responses from multiple DNS servers
 * - View query times and server performance
 * - Troubleshoot DNS resolution issues
 *
 * @see Story NAS-5.9 - Implement DNS Lookup Tool
 */

import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from '@nasnet/core/i18n';
import { DnsLookupTool } from '@nasnet/features/diagnostics';

export const Route = createFileRoute('/dashboard/dns-lookup')({
  component: DnsLookupPage,
});

export function DnsLookupPage() {
  const { t } = useTranslation('diagnostics');
  // TODO: Get actual device ID from router context or state
  // For now, using placeholder until router context is implemented
  const deviceId = 'current-router-id';

  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("dnsLookup.title")}</h1>
        <p className="text-muted-foreground">
          {t('dnsLookup.description')}
        </p>
      </div>

      <DnsLookupTool deviceId={deviceId} />
    </div>
  );
}
