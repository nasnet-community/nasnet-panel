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

export const QuickIPOverview = React.memo(function QuickIPOverview({ ipAddresses, isLoading, error }: QuickIPOverviewProps) {
  const { t } = useTranslation('network');
  const [expandedInterface, setExpandedInterface] = useState<string | null>(null);

  const groupedIPs = useMemo(() => {
    return ipAddresses.reduce((acc, ip) => {
      if (!acc[ip.interface]) acc[ip.interface] = [];
      acc[ip.interface].push(ip);
      return acc;
    }, {} as Record<string, IPAddress[]>);
  }, [ipAddresses]);

  const interfaceNames = Object.keys(groupedIPs);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="h-5 bg-muted rounded w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-destructive/30 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{t('ipConfig.failedToLoad')}</span>
        </div>
        <p className="text-xs text-destructive/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-category-networking/15 flex items-center justify-center">
            <Globe className="w-4 h-4 text-category-networking" />
          </div>
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground">{t('ipConfig.title')}</h3>
            <p className="text-xs text-muted-foreground">{ipAddresses.length} {t('ipConfig.configured')}</p>
          </div>
        </div>
      </div>

      {interfaceNames.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">{t('ipConfig.noConfigured')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {interfaceNames.map((ifaceName) => {
            const ips = groupedIPs[ifaceName];
            const isExpanded = expandedInterface === ifaceName;

            return (
              <div key={ifaceName} className="bg-muted rounded-lg overflow-hidden border border-border/50">
                <button
                  onClick={() => setExpandedInterface(isExpanded ? null : ifaceName)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-medium text-foreground">{ifaceName}</span>
                    <span className="px-1.5 py-0.5 text-xs bg-border text-muted-foreground rounded">
                      {ips.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpanded && ips.length > 0 && (
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{ips[0].address}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2">
                    {ips.map((ip) => (
                      <div key={ip.id} className="flex items-center justify-between py-1">
                        <span className="text-sm font-mono font-semibold text-foreground">{ip.address}</span>
                        <span className={cn('px-2 py-0.5 text-xs rounded font-mono',
                          ip.isDynamic
                            ? 'bg-success/15 text-success'
                            : 'bg-info/15 text-info'
                        )}>
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
      )}
    </div>
  );
});

QuickIPOverview.displayName = 'QuickIPOverview';
