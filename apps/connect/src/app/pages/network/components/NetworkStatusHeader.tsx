/**
 * Network Status Header Component
 * Card-Heavy design - Router info + resource stats grid
 */

import React from 'react';

import { Cpu, HardDrive, Clock, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type SystemInfo, type SystemResource } from '@nasnet/core/types';
import { formatBytes, parseRouterOSUptime, calculateStatus } from '@nasnet/core/utils';

import { cn } from '@nasnet/ui/utils';

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

export const NetworkStatusHeader = React.memo(function NetworkStatusHeader({
  routerInfo,
  resourceData,
  networkStatus,
  activeCount,
  totalCount,
  isLoading,
}: NetworkStatusHeaderProps) {
  const { t } = useTranslation('network');
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
    healthy: { label: t('status.online'), dotClass: 'bg-success', textClass: 'text-success', pulseClass: 'animate-pulse' },
    warning: { label: t('status.degraded'), dotClass: 'bg-warning', textClass: 'text-warning', pulseClass: '' },
    error: { label: t('status.offline'), dotClass: 'bg-error', textClass: 'text-error', pulseClass: '' },
    loading: { label: t('status.connecting'), dotClass: 'bg-muted-foreground', textClass: 'text-muted-foreground', pulseClass: 'animate-pulse' },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted rounded-xl p-3">
              <div className="h-4 bg-muted rounded w-12 mb-2" />
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            networkStatus === 'healthy' ? 'bg-success/20' :
            networkStatus === 'warning' ? 'bg-warning/20' :
            networkStatus === 'error' ? 'bg-error/20' : 'bg-muted-foreground/20'
          )}>
            <span className={cn('w-3 h-3 rounded-full', status.dotClass, status.pulseClass)} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {routerInfo?.identity || 'Router'}
            </h1>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', status.textClass)}>{status.label}</span>
              {routerInfo?.routerOsVersion && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {t('status.routerOS')} {routerInfo.routerOsVersion}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {routerInfo?.model && (
          <span className="hidden sm:inline-flex px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            {routerInfo.model}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="bg-muted rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-info" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.cpu')}</p>
          </div>
          <p className="text-xl font-bold text-foreground">{resourceData?.cpuLoad ?? '--'}%</p>
          {resourceData?.cpuLoad !== undefined && (
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className={cn('h-1.5 rounded-full transition-all duration-300',
                  calculateStatus(resourceData.cpuLoad) === 'healthy' ? 'bg-info' :
                  calculateStatus(resourceData.cpuLoad) === 'warning' ? 'bg-warning' : 'bg-error'
                )}
                style={{ width: `${resourceData.cpuLoad}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-muted rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-warning" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.memory')}</p>
          </div>
          <p className="text-xl font-bold text-foreground">{memoryPercentage}%</p>
          {resourceData && (
            <>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className={cn('h-1.5 rounded-full transition-all duration-300',
                    calculateStatus(memoryPercentage) === 'healthy' ? 'bg-warning' :
                    calculateStatus(memoryPercentage) === 'warning' ? 'bg-warning' : 'bg-error'
                  )}
                  style={{ width: `${memoryPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(memoryUsed)} / {formatBytes(resourceData.totalMemory)}
              </p>
            </>
          )}
        </div>

        <div className="bg-muted rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-success" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.uptime')}</p>
          </div>
          <p className="text-xl font-bold text-foreground">{uptimeFormatted}</p>
        </div>

        <div className="bg-muted rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('quickStats.interfaces')}</p>
          </div>
          <p className="text-xl font-bold text-foreground">
            {activeCount}<span className="text-sm font-normal text-muted-foreground">/{totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t('quickStats.active')}</p>
        </div>
      </div>
    </div>
  );
});

NetworkStatusHeader.displayName = 'NetworkStatusHeader';






















