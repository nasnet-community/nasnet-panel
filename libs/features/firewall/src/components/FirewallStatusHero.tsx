/**
 * Firewall Status Hero Component
 *
 * @description Dashboard Pro style stats grid showing firewall security metrics (protection status, rule counts, active/disabled breakdown, last updated timestamp).
 * Epic 0.6 Enhancement: Dashboard Overview.
 */

import { memo, useMemo, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldAlert, FileText, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { useFilterRules, useNATRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

/**
 * @description Props for FirewallStatusHero component
 */
interface FirewallStatusHeroProps {
  className?: string;
}

/**
 * @description Determine protection status based on firewall rules configuration
 */
function getProtectionStatus(
  filterRulesCount: number,
  hasDropRules: boolean
): 'protected' | 'warning' | 'minimal' {
  if (filterRulesCount === 0) {
    return 'minimal';
  }
  if (!hasDropRules) {
    return 'warning';
  }
  return 'protected';
}

/**
 * FirewallStatusHero Component
 *
 * Features:
 * - Protection status indicator with shield icon
 * - Total rules count (filter + NAT)
 * - Active vs disabled rules breakdown
 * - Last data refresh timestamp
 * - Loading skeleton state
 */
export const FirewallStatusHero = memo(function FirewallStatusHero({
  className,
}: FirewallStatusHeroProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  const {
    data: filterRules,
    isLoading: isLoadingFilter,
    dataUpdatedAt: filterUpdatedAt,
    refetch: refetchFilter,
    isFetching: isFetchingFilter,
  } = useFilterRules(routerIp);

  const {
    data: natRules,
    isLoading: isLoadingNAT,
    dataUpdatedAt: natUpdatedAt,
    refetch: refetchNAT,
    isFetching: isFetchingNAT,
  } = useNATRules(routerIp);

  const isLoading = isLoadingFilter || isLoadingNAT;
  const isFetching = isFetchingFilter || isFetchingNAT;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalFilter = filterRules?.length || 0;
    const totalNAT = natRules?.length || 0;
    const totalRules = totalFilter + totalNAT;

    const activeFilter = filterRules?.filter((r) => !r.disabled).length || 0;
    const activeNAT = natRules?.filter((r) => !r.disabled).length || 0;
    const activeRules = activeFilter + activeNAT;

    const disabledRules = totalRules - activeRules;

    const hasDropRules =
      filterRules?.some((r) => !r.disabled && (r.action === 'drop' || r.action === 'reject')) ||
      false;

    const status = getProtectionStatus(totalFilter, hasDropRules);

    return {
      totalRules,
      activeRules,
      disabledRules,
      totalFilter,
      totalNAT,
      status,
    };
  }, [filterRules, natRules]);

  // Format last updated time
  const lastUpdated = useMemo(() => {
    const timestamp = Math.max(filterUpdatedAt || 0, natUpdatedAt || 0);
    if (!timestamp) return null;
    return new Date(timestamp);
  }, [filterUpdatedAt, natUpdatedAt]);

  const handleRefresh = useCallback(() => {
    refetchFilter();
    refetchNAT();
  }, [refetchFilter, refetchNAT]);

  // Status display configuration (using semantic token variants)
  const statusConfig = useMemo(
    () => ({
      protected: {
        icon: ShieldCheck,
        label: 'Protected',
        description: 'Firewall active',
        bgColor: 'bg-success/10',
        borderColor: 'border-success',
        iconColor: 'text-success',
        textColor: 'text-success',
      },
      warning: {
        icon: ShieldAlert,
        label: 'Warning',
        description: 'No drop rules',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning',
        iconColor: 'text-warning',
        textColor: 'text-warning',
      },
      minimal: {
        icon: Shield,
        label: 'Minimal',
        description: 'No filter rules',
        bgColor: 'bg-muted',
        borderColor: 'border-border',
        iconColor: 'text-muted-foreground',
        textColor: 'text-muted-foreground',
      },
    }),
    []
  );

  if (isLoading) {
    return (
      <div
        className={cn('gap-component-sm grid grid-cols-2 md:grid-cols-4', className)}
        role="status"
        aria-label="Loading firewall status"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card border-border p-component-md animate-pulse rounded-[var(--semantic-radius-card)] border"
          >
            <div className="bg-muted mb-component-sm h-4 w-16 rounded" />
            <div className="bg-muted mb-component-xs h-7 w-12 rounded" />
            <div className="bg-muted mt-component-sm h-3 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const currentStatus = statusConfig[stats.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div
      className={cn('gap-component-sm grid grid-cols-2 md:grid-cols-4', className)}
      role="region"
      aria-label="Firewall status overview"
    >
      {/* Protection Status */}
      <div
        className={cn(
          'p-component-md rounded-[var(--semantic-radius-card)] border',
          currentStatus.bgColor,
          currentStatus.borderColor
        )}
      >
        <div className="gap-component-sm mb-component-xs flex items-center">
          <StatusIcon
            className={`h-4 w-4 ${currentStatus.iconColor}`}
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Status
          </p>
        </div>
        <p className={`text-xl font-bold ${currentStatus.textColor}`}>{currentStatus.label}</p>
        <p className="text-muted-foreground mt-component-xs text-xs">{currentStatus.description}</p>
      </div>

      {/* Total Rules */}
      <div className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-sm mb-component-xs flex items-center">
          <FileText
            className="text-secondary h-4 w-4"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Total Rules
          </p>
        </div>
        <p className="text-foreground text-xl font-bold md:text-2xl">{stats.totalRules}</p>
        <p className="text-muted-foreground mt-component-xs text-xs">
          {stats.totalFilter} filter, {stats.totalNAT} NAT
        </p>
      </div>

      {/* Active Rules */}
      <div className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
        <div className="gap-component-sm mb-component-xs flex items-center">
          <Shield
            className="text-success h-4 w-4"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Active
          </p>
        </div>
        <p className="text-foreground text-xl font-bold md:text-2xl">
          {stats.activeRules}
          <span className="text-muted-foreground ml-component-xs text-sm font-normal">
            /{stats.totalRules}
          </span>
        </p>
        {stats.disabledRules > 0 && (
          <p className="text-muted-foreground mt-component-xs text-xs">
            {stats.disabledRules} disabled
          </p>
        )}
      </div>

      {/* Last Updated */}
      <div className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
        <div className="mb-component-xs flex items-center justify-between">
          <div className="gap-component-sm flex items-center">
            <Clock
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Updated
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-component-xs hover:bg-muted focus-visible:ring-ring rounded-[var(--semantic-radius-button)] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
            aria-label={isFetching ? 'Refreshing firewall data' : 'Refresh firewall data'}
          >
            <RefreshCw
              className={`text-muted-foreground h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <p className="text-foreground text-lg font-semibold">
          {lastUpdated ?
            lastUpdated.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-'}
        </p>
        <p className="text-muted-foreground mt-component-xs text-xs">
          {lastUpdated ?
            lastUpdated.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })
          : 'Never refreshed'}
        </p>
      </div>
    </div>
  );
});

FirewallStatusHero.displayName = 'FirewallStatusHero';
