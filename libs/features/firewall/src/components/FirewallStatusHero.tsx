/**
 * Firewall Status Hero Component
 * Dashboard Pro style stats grid showing firewall security metrics
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { useMemo } from 'react';
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
export function FirewallStatusHero({ className }: FirewallStatusHeroProps) {
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
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className || ''}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-1" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 mt-2" />
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
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-900',
      iconColor: 'text-green-500',
      textColor: 'text-green-700 dark:text-green-400',
    },
    warning: {
      icon: ShieldAlert,
      label: 'Warning',
      description: 'No drop rules',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900',
      iconColor: 'text-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
    minimal: {
      icon: Shield,
      label: 'Minimal',
      description: 'No filter rules',
      bgColor: 'bg-slate-50 dark:bg-slate-800/50',
      borderColor: 'border-slate-200 dark:border-slate-700',
      iconColor: 'text-slate-400',
      textColor: 'text-slate-600 dark:text-slate-400',
    },
  };

  const currentStatus = statusConfig[stats.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className || ''}`}>
      {/* Protection Status */}
      <div
        className={`rounded-xl border p-4 ${currentStatus.bgColor} ${currentStatus.borderColor}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon className={`w-4 h-4 ${currentStatus.iconColor}`} />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Status
          </p>
        </div>
        <p className={`text-xl font-bold ${currentStatus.textColor}`}>
          {currentStatus.label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {currentStatus.description}
        </p>
      </div>

      {/* Total Rules */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-secondary-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Total Rules
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {stats.totalRules}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {stats.totalFilter} filter, {stats.totalNAT} NAT
        </p>
      </div>

      {/* Active Rules */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-emerald-500" />
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
            Active
          </p>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          {stats.activeRules}
          <span className="text-slate-400 dark:text-slate-500 text-sm font-normal ml-1">
            /{stats.totalRules}
          </span>
        </p>
        {stats.disabledRules > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.disabledRules} disabled
          </p>
        )}
      </div>

      {/* Last Updated */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              Updated
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-400 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          {lastUpdated
            ? lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
}

























