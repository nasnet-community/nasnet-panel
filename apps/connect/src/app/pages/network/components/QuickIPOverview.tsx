/**
 * Quick IP Overview Component
 * Light/dark theme support - Compact IP configuration view
 */

import React, { useMemo, useState } from 'react';

import { Globe, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type IPAddress } from '@nasnet/core/types';

import { cn } from '@nasnet/ui/utils';

interface QuickIPOverviewProps {
  ipAddresses: IPAddress[];
  isLoading?: boolean;
  error?: Error | null;
}

export const QuickIPOverview = React.memo(function QuickIPOverview({
  ipAddresses,
  isLoading,
  error,
}: QuickIPOverviewProps) {
  const { t } = useTranslation('network');
  const [expandedInterface, setExpandedInterface] = useState<string | null>(null);

  const groupedIPs = useMemo(() => {
    return ipAddresses.reduce(
      (acc, ip) => {
        if (!acc[ip.interface]) acc[ip.interface] = [];
        acc[ip.interface].push(ip);
        return acc;
      },
      {} as Record<string, IPAddress[]>
    );
  }, [ipAddresses]);

  const interfaceNames = Object.keys(groupedIPs);

  if (isLoading) {
    return (
      <div className="bg-card border-border animate-pulse rounded-2xl border p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-muted h-8 w-8 rounded-lg" />
          <div className="bg-muted h-5 w-32 rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-muted h-14 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border-destructive/30 rounded-2xl border p-4">
        <div className="text-destructive flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{t('ipConfig.failedToLoad')}</span>
        </div>
        <p className="text-destructive/70 mt-1 text-xs">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-category-networking/15 flex h-8 w-8 items-center justify-center rounded-lg">
            <Globe className="text-category-networking h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-foreground text-sm font-semibold">
              {t('ipConfig.title')}
            </h3>
            <p className="text-muted-foreground text-xs">
              {ipAddresses.length} {t('ipConfig.configured')}
            </p>
          </div>
        </div>
      </div>

      {interfaceNames.length === 0 ?
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-sm">{t('ipConfig.noConfigured')}</p>
        </div>
      : <div className="space-y-2">
          {interfaceNames.map((ifaceName) => {
            const ips = groupedIPs[ifaceName];
            const isExpanded = expandedInterface === ifaceName;

            return (
              <div
                key={ifaceName}
                className="bg-muted border-border/50 overflow-hidden rounded-lg border"
              >
                <button
                  onClick={() => setExpandedInterface(isExpanded ? null : ifaceName)}
                  className="hover:bg-muted/80 flex w-full items-center justify-between p-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display text-foreground text-sm font-medium">
                      {ifaceName}
                    </span>
                    <span className="bg-border text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                      {ips.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpanded && ips.length > 0 && (
                      <span className="text-muted-foreground font-mono text-xs font-semibold">
                        {ips[0].address}
                      </span>
                    )}
                    {isExpanded ?
                      <ChevronUp className="text-muted-foreground h-4 w-4" />
                    : <ChevronDown className="text-muted-foreground h-4 w-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="space-y-2 px-3 pb-3">
                    {ips.map((ip) => (
                      <div
                        key={ip.id}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-foreground font-mono text-sm font-semibold">
                          {ip.address}
                        </span>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 font-mono text-xs',
                            ip.isDynamic ? 'bg-success/15 text-success' : 'bg-info/15 text-info'
                          )}
                        >
                          {ip.isDynamic ? t('ipConfig.dynamic') : t('ipConfig.static')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      }
    </div>
  );
});

QuickIPOverview.displayName = 'QuickIPOverview';
