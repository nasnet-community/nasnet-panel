/**
 * Connected Devices Card Component
 * Light/dark theme support - ARP/DHCP device summary
 */

import { useMemo } from 'react';
import { ARPEntry } from '@nasnet/core/types';
import { formatMACAddress } from '@nasnet/core/utils';
import { Users, CheckCircle, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectedDevicesCardProps {
  entries: ARPEntry[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ConnectedDevicesCard({ entries, isLoading, error }: ConnectedDevicesCardProps) {
  const stats = useMemo(() => {
    const complete = entries.filter((e) => e.status === 'complete').length;
    const incomplete = entries.filter((e) => e.status === 'incomplete').length;
    const failed = entries.filter((e) => e.status === 'failed').length;
    return { total: entries.length, complete, incomplete, failed };
  }, [entries]);

  const recentDevices = entries.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-800/50 p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Failed to load devices</span>
        </div>
        <p className="text-xs text-red-500/70 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-secondary-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Connected Devices</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{stats.total} in ARP table</p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs text-slate-600 dark:text-slate-400">{stats.complete} complete</span>
        </div>
        {stats.incomplete > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">{stats.incomplete} incomplete</span>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">{stats.failed} failed</span>
          </div>
        )}
      </div>

      {/* Recent Devices List */}
      <div className="space-y-2">
        {recentDevices.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">No devices found</p>
          </div>
        ) : (
          recentDevices.map((device) => (
            <div
              key={device.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn('w-2 h-2 rounded-full',
                  device.status === 'complete' ? 'bg-emerald-500' :
                  device.status === 'incomplete' ? 'bg-amber-500' : 'bg-red-500'
                )} />
                <div>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">{device.ipAddress}</p>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatMACAddress(device.macAddress)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{device.interface}</span>
            </div>
          ))
        )}
      </div>

      {entries.length > 5 && (
        <button className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium py-2 transition-colors">
          View all {entries.length} devices
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
