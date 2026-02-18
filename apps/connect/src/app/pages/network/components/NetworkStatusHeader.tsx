/**
 * Network Status Header Component
 * Card-Heavy design - Router info + resource stats grid
 */

import { Cpu, HardDrive, Clock, Wifi } from 'lucide-react';

import { type SystemInfo, type SystemResource } from '@nasnet/core/types';
import { formatBytes, parseRouterOSUptime, calculateStatus } from '@nasnet/core/utils';

import { cn } from '@/lib/utils';

type NetworkStatus = 'healthy' | 'warning' | 'error' | 'loading';

interface NetworkStatusHeaderProps {
  routerInfo?: SystemInfo;
  resourceData?: SystemResource;
  networkStatus: NetworkStatus;
  activeCount: number;
  totalCount: number;
  isLoading?: boolean;
  lastUpdated?: number;
}

export function NetworkStatusHeader({
  routerInfo,
  resourceData,
  networkStatus,
  activeCount,
  totalCount,
  isLoading,
}: NetworkStatusHeaderProps) {
  const memoryUsed = resourceData
    ? resourceData.totalMemory - resourceData.freeMemory
    : 0;
  const memoryPercentage = resourceData
    ? Math.round((memoryUsed / resourceData.totalMemory) * 100)
    : 0;

  const uptimeFormatted = resourceData?.uptime
    ? parseRouterOSUptime(resourceData.uptime)
    : '--';

  const statusConfig = {
    healthy: { label: 'Online', dotClass: 'bg-emerald-500', textClass: 'text-emerald-400', pulseClass: 'animate-pulse' },
    warning: { label: 'Degraded', dotClass: 'bg-amber-500', textClass: 'text-amber-400', pulseClass: '' },
    error: { label: 'Offline', dotClass: 'bg-red-500', textClass: 'text-red-400', pulseClass: '' },
    loading: { label: 'Connecting', dotClass: 'bg-slate-400', textClass: 'text-slate-400', pulseClass: 'animate-pulse' },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            networkStatus === 'healthy' ? 'bg-emerald-500/20' :
            networkStatus === 'warning' ? 'bg-amber-500/20' :
            networkStatus === 'error' ? 'bg-red-500/20' : 'bg-slate-500/20'
          )}>
            <span className={cn('w-3 h-3 rounded-full', status.dotClass, status.pulseClass)} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {routerInfo?.identity || 'Router'}
            </h1>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', status.textClass)}>{status.label}</span>
              {routerInfo?.routerOsVersion && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    RouterOS {routerInfo.routerOsVersion}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {routerInfo?.model && (
          <span className="hidden sm:inline-flex px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
            {routerInfo.model}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">CPU</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{resourceData?.cpuLoad ?? '--'}%</p>
          {resourceData?.cpuLoad !== undefined && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
              <div
                className={cn('h-1.5 rounded-full transition-all duration-300',
                  calculateStatus(resourceData.cpuLoad) === 'healthy' ? 'bg-cyan-500' :
                  calculateStatus(resourceData.cpuLoad) === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${resourceData.cpuLoad}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Memory</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{memoryPercentage}%</p>
          {resourceData && (
            <>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className={cn('h-1.5 rounded-full transition-all duration-300',
                    calculateStatus(memoryPercentage) === 'healthy' ? 'bg-purple-500' :
                    calculateStatus(memoryPercentage) === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${memoryPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {formatBytes(memoryUsed)} / {formatBytes(resourceData.totalMemory)}
              </p>
            </>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Uptime</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{uptimeFormatted}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="w-3.5 h-3.5 text-primary-500" />
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Interfaces</p>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {activeCount}<span className="text-sm font-normal text-slate-400 dark:text-slate-500">/{totalCount}</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">active</p>
        </div>
      </div>
    </div>
  );
}

























