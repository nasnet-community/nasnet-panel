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
  const memoryUsed = resourceData ? resourceData.totalMemory - resourceData.freeMemory : 0;
  const memoryPercentage =
    resourceData ? Math.round((memoryUsed / resourceData.totalMemory) * 100) : 0;

  const uptimeFormatted = resourceData?.uptime ? parseRouterOSUptime(resourceData.uptime) : '--';

  const statusConfig = {
    healthy: {
      label: t('status.online'),
      dotClass: 'bg-success',
      textClass: 'text-success',
      pulseClass: 'animate-pulse',
    },
    warning: {
      label: t('status.degraded'),
      dotClass: 'bg-warning',
      textClass: 'text-warning',
      pulseClass: '',
    },
    error: {
      label: t('status.offline'),
      dotClass: 'bg-error',
      textClass: 'text-error',
      pulseClass: '',
    },
    loading: {
      label: t('status.connecting'),
      dotClass: 'bg-muted-foreground',
      textClass: 'text-muted-foreground',
      pulseClass: 'animate-pulse',
    },
  };

  const status = statusConfig[networkStatus];

  if (isLoading) {
    return (
      <div className="bg-card rounded-card-lg border-border p-component-md animate-pulse border">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-2">
            <div className="bg-muted h-6 w-32 rounded" />
            <div className="bg-muted h-4 w-24 rounded" />
          </div>
        </div>
        <div className="gap-component-md grid grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-muted rounded-card-lg p-component-sm"
            >
              <div className="bg-muted mb-2 h-4 w-12 rounded" />
              <div className="bg-muted h-6 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-card-lg border-border p-component-md category-header category-header-networking border shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              networkStatus === 'healthy' ? 'bg-success/20'
              : networkStatus === 'warning' ? 'bg-warning/20'
              : networkStatus === 'error' ? 'bg-error/20'
              : 'bg-muted-foreground/20'
            )}
          >
            <span className={cn('h-3 w-3 rounded-full', status.dotClass, status.pulseClass)} />
          </div>
          <div>
            <h1 className="font-display text-foreground text-lg font-bold">
              {routerInfo?.identity || 'Router'}
            </h1>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', status.textClass)}>{status.label}</span>
              {routerInfo?.routerOsVersion && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground text-xs">
                    {t('status.routerOS')} {routerInfo.routerOsVersion}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {routerInfo?.model && (
          <span className="bg-muted text-muted-foreground hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex">
            {routerInfo.model}
          </span>
        )}
      </div>

      <div className="gap-component-sm md:gap-component-md grid grid-cols-2 md:grid-cols-4">
        <div className="bg-muted rounded-card-lg p-component-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <Cpu className="text-info h-3.5 w-3.5" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.cpu')}
            </p>
          </div>
          <p className="text-foreground font-mono text-xl font-bold">
            {resourceData?.cpuLoad ?? '--'}%
          </p>
          {resourceData?.cpuLoad !== undefined && (
            <div className="bg-muted mt-2 h-1.5 w-full rounded-full">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  calculateStatus(resourceData.cpuLoad) === 'healthy' ? 'bg-info'
                  : calculateStatus(resourceData.cpuLoad) === 'warning' ? 'bg-warning'
                  : 'bg-error'
                )}
                style={{ width: `${resourceData.cpuLoad}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-muted rounded-card-lg p-component-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <HardDrive className="text-warning h-3.5 w-3.5" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.memory')}
            </p>
          </div>
          <p className="text-foreground font-mono text-xl font-bold">{memoryPercentage}%</p>
          {resourceData && (
            <>
              <div className="bg-muted mt-2 h-1.5 w-full rounded-full">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    calculateStatus(memoryPercentage) === 'healthy' ? 'bg-warning'
                    : calculateStatus(memoryPercentage) === 'warning' ? 'bg-warning'
                    : 'bg-error'
                  )}
                  style={{ width: `${memoryPercentage}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatBytes(memoryUsed)} / {formatBytes(resourceData.totalMemory)}
              </p>
            </>
          )}
        </div>

        <div className="bg-muted rounded-card-lg p-component-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <Clock className="text-success h-3.5 w-3.5" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.uptime')}
            </p>
          </div>
          <p className="text-foreground font-mono text-xl font-bold">{uptimeFormatted}</p>
        </div>

        <div className="bg-muted rounded-card-lg p-component-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5">
            <Wifi className="text-primary h-3.5 w-3.5" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {t('quickStats.interfaces')}
            </p>
          </div>
          <p className="text-foreground font-mono text-xl font-bold">
            {activeCount}
            <span className="text-muted-foreground text-sm font-normal">/{totalCount}</span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{t('quickStats.active')}</p>
        </div>
      </div>
    </div>
  );
});

NetworkStatusHeader.displayName = 'NetworkStatusHeader';
