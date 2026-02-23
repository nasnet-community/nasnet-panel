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

export const ConnectedDevicesCard = React.memo(function ConnectedDevicesCard({ entries, isLoading, error }: ConnectedDevicesCardProps) {
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
      <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-muted rounded-lg" />
          <div className="h-5 bg-muted rounded w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
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
          <span className="text-sm font-medium">{t('connectedDevices.loadError')}</span>
        </div>
        <p className="text-xs text-destructive/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
            <Users className="w-4 h-4 text-info" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('connectedDevices.title')}</h3>
            <p className="text-xs text-muted-foreground">{stats.total} {t('connectedDevices.inArp')}</p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-success" />
          <span className="text-xs text-muted-foreground">{stats.complete} {t('arp.statusComplete').toLowerCase()}</span>
        </div>
        {stats.incomplete > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs text-muted-foreground">{stats.incomplete} {t('arp.statusIncomplete').toLowerCase()}</span>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs text-muted-foreground">{stats.failed} {t('arp.statusFailed').toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Recent Devices List */}
      <div className="space-y-2">
        {recentDevices.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{t('connectedDevices.noDevices')}</p>
          </div>
        ) : (
          recentDevices.map((device) => (
            <div
              key={device.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                'bg-muted hover:bg-muted/80 transition-colors'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn('w-2 h-2 rounded-full',
                  device.status === 'complete' ? 'bg-success' :
                  device.status === 'incomplete' ? 'bg-warning' : 'bg-destructive'
                )} />
                <div>
                  <p className="text-sm font-mono text-foreground">{device.ipAddress}</p>
                  <p className="text-xs font-mono text-muted-foreground">{formatMACAddress(device.macAddress)}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{device.interface}</span>
            </div>
          ))
        )}
      </div>

      {entries.length > 5 && (
        <button className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/90 font-medium py-2 transition-colors">
          {t('connectedDevices.viewAll', { count: entries.length })}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

ConnectedDevicesCard.displayName = 'ConnectedDevicesCard';
