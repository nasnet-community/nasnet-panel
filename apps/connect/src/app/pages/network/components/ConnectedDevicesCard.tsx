/**
 * Connected Devices Card Component
 * Light/dark theme support - ARP/DHCP device summary
 */

import React, { useMemo } from 'react';

import { Users, CheckCircle, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type ARPEntry } from '@nasnet/core/types';
import { formatMACAddress } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

interface ConnectedDevicesCardProps {
  entries: ARPEntry[];
  isLoading?: boolean;
  error?: Error | null;
}

export const ConnectedDevicesCard = React.memo(function ConnectedDevicesCard({
  entries,
  isLoading,
  error,
}: ConnectedDevicesCardProps) {
  const { t } = useTranslation('network');
  const stats = useMemo(() => {
    const complete = entries.filter((e) => e.status === 'complete').length;
    const incomplete = entries.filter((e) => e.status === 'incomplete').length;
    const failed = entries.filter((e) => e.status === 'failed').length;
    return { total: entries.length, complete, incomplete, failed };
  }, [entries]);

  const recentDevices = entries.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-card border-border animate-pulse rounded-2xl border p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-muted h-8 w-8 rounded-lg" />
          <div className="bg-muted h-5 w-32 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted h-12 rounded-lg"
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
          <span className="text-sm font-medium">{t('connectedDevices.loadError')}</span>
        </div>
        <p className="text-destructive/70 mt-1 text-xs">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border rounded-2xl border p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-info/15 flex h-8 w-8 items-center justify-center rounded-lg">
            <Users className="text-info h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-foreground text-sm font-semibold">
              {t('connectedDevices.title')}
            </h3>
            <p className="text-muted-foreground text-xs">
              {stats.total} {t('connectedDevices.inArp')}
            </p>
          </div>
        </div>
        <span className="text-foreground font-mono text-2xl font-bold">{stats.total}</span>
      </div>

      {/* Status Summary */}
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="text-success h-3.5 w-3.5" />
          <span className="text-muted-foreground text-xs">
            {stats.complete} {t('arp.statusComplete').toLowerCase()}
          </span>
        </div>
        {stats.incomplete > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="text-warning h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs">
              {stats.incomplete} {t('arp.statusIncomplete').toLowerCase()}
            </span>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="text-destructive h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs">
              {stats.failed} {t('arp.statusFailed').toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Recent Devices List */}
      <div className="space-y-2">
        {recentDevices.length === 0 ?
          <div className="py-4 text-center">
            <p className="text-muted-foreground text-sm">{t('connectedDevices.noDevices')}</p>
          </div>
        : recentDevices.map((device) => (
            <div
              key={device.id}
              className={cn(
                'rounded-card-sm flex items-center justify-between p-2',
                'bg-muted hover:bg-muted/80 border-border/50 border transition-colors'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    device.status === 'complete' ? 'bg-success'
                    : device.status === 'incomplete' ? 'bg-warning'
                    : 'bg-destructive'
                  )}
                />
                <div>
                  <p className="text-foreground font-mono text-sm font-semibold">
                    {device.ipAddress}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatMACAddress(device.macAddress)}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground font-mono text-xs">{device.interface}</span>
            </div>
          ))
        }
      </div>

      {entries.length > 5 && (
        <button className="text-primary hover:text-primary/90 focus-visible:ring-ring mt-3 flex w-full items-center justify-center gap-1 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
          {t('connectedDevices.viewAll', { count: entries.length })}
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
});

ConnectedDevicesCard.displayName = 'ConnectedDevicesCard';
