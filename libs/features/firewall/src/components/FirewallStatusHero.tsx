/**
 * Firewall Status Hero Component
 * Dashboard Pro style stats grid showing firewall security metrics
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { memo, useMemo } from 'react';
import { Shield, ShieldCheck, ShieldAlert, FileText, Clock, RefreshCw } from 'lucide-react';
import { useFilterRules, useNATRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

interface FirewallStatusHeroProps {
  className?: string;
}

/**
 * Determine protection status based on firewall rules
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
export const FirewallStatusHero = memo(function FirewallStatusHero({ className }: FirewallStatusHeroProps) {
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
      filterRules?.some(
        (r) => !r.disabled && (r.action === 'drop' || r.action === 'reject')
      ) || false;

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

  const handleRefresh = () => {
    refetchFilter();
    refetchNAT();
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className || ''}`} role="status" aria-label="Loading firewall status">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-7 bg-muted rounded w-12 mb-1" />
            <div className="h-3 bg-muted rounded w-20 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  // Status display configuration
  const statusConfig = {
    protected: {
      icon: ShieldCheck,
      label: 'Protected',
      description: 'Firewall active',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      iconColor: 'text-success',
      textColor: 'text-success',
    },
    warning: {
      icon: ShieldAlert,
      label: 'Warning',
      description: 'No drop rules',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
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
  };

  const currentStatus = statusConfig[stats.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className || ''}`} role="region" aria-label="Firewall status overview">
      {/* Protection Status */}
      <div
        className={`rounded-xl border p-4 ${currentStatus.bgColor} ${currentStatus.borderColor}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon className={`w-4 h-4 ${currentStatus.iconColor}`} aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Status
          </p>
        </div>
        <p className={`text-xl font-bold ${currentStatus.textColor}`}>
          {currentStatus.label}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {currentStatus.description}
        </p>
      </div>

      {/* Total Rules */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-secondary" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Total Rules
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {stats.totalRules}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.totalFilter} filter, {stats.totalNAT} NAT
        </p>
      </div>

      {/* Active Rules */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-success" aria-hidden="true" />
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Active
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-foreground">
          {stats.activeRules}
          <span className="text-muted-foreground text-sm font-normal ml-1">
            /{stats.totalRules}
          </span>
        </p>
        {stats.disabledRules > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {stats.disabledRules} disabled
          </p>
        )}
      </div>

      {/* Last Updated */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Updated
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Refresh firewall data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        <p className="text-lg font-semibold text-foreground">
          {lastUpdated
            ? lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {lastUpdated
            ? lastUpdated.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })
            : 'Never refreshed'}
        </p>
      </div>
    </div>
  );
});

















