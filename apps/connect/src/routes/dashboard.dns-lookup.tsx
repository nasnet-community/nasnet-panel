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

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from '@nasnet/core/i18n';
import { DnsLookupTool } from '@nasnet/features/diagnostics';
import { useConnectionStore } from '@nasnet/state/stores';

export const Route = createFileRoute('/dashboard/dns-lookup')({
  component: DnsLookupPage,
});

export function DnsLookupPage() {
  const { t } = useTranslation('diagnostics');
  const navigate = useNavigate();
  const deviceId = useConnectionStore((state) => state.activeRouterId);

  if (!deviceId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-error/10 border border-error/20 rounded-lg p-6 text-center" role="alert">
          <h2 className="text-lg font-semibold text-error mb-2">{t('dnsLookup.noRouterSelected')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('dnsLookup.selectRouterMessage')}
          </p>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            aria-label={t('dnsLookup.returnToDashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('dnsLookup.returnToDashboard')}
          </button>
        </div>
      </div>
    );
  }

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
