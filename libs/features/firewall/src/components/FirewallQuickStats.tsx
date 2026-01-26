/**
 * Firewall Quick Stats Component
 * Compact summary of chain and action distribution
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import { useMemo } from 'react';
import { useFilterRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallRule } from '@nasnet/core/types';

interface FirewallQuickStatsProps {
  className?: string;
}

interface ChainStats {
  chain: string;
  total: number;
  accept: number;
  drop: number;
  reject: number;
  disabled: number;
  color: string;
}

function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    input: 'bg-blue-500',
    forward: 'bg-purple-500',
    output: 'bg-amber-500',
  };
  return colors[chain] || 'bg-slate-500';
}

export function FirewallQuickStats({ className }: FirewallQuickStatsProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules, isLoading } = useFilterRules(routerIp);

  const chainStats = useMemo(() => {
    if (!rules || rules.length === 0) return [];

    const stats: Record<string, ChainStats> = {};

    rules.forEach((rule: FirewallRule) => {
      if (!stats[rule.chain]) {
        stats[rule.chain] = {
          chain: rule.chain,
          total: 0,
          accept: 0,
          drop: 0,
          reject: 0,
          disabled: 0,
          color: getChainColor(rule.chain),
        };
      }

      stats[rule.chain].total++;
      if (rule.disabled) {
        stats[rule.chain].disabled++;
      } else {
        if (rule.action === 'accept') stats[rule.chain].accept++;
        else if (rule.action === 'drop') stats[rule.chain].drop++;
        else if (rule.action === 'reject') stats[rule.chain].reject++;
      }
    });

    const order = ['input', 'forward', 'output'];
    return Object.values(stats).sort((a, b) => {
      const aIndex = order.indexOf(a.chain);
      const bIndex = order.indexOf(b.chain);
      if (aIndex === -1 && bIndex === -1) return a.chain.localeCompare(b.chain);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [rules]);

  const actionTotals = useMemo(() => {
    if (!rules) return { accept: 0, drop: 0, reject: 0, other: 0 };

    return rules.reduce(
      (acc, rule) => {
        if (rule.disabled) return acc;
        if (rule.action === 'accept') acc.accept++;
        else if (rule.action === 'drop') acc.drop++;
        else if (rule.action === 'reject') acc.reject++;
        else acc.other++;
        return acc;
      },
      { accept: 0, drop: 0, reject: 0, other: 0 }
    );
  }, [rules]);

  const totalActive = actionTotals.accept + actionTotals.drop + actionTotals.reject + actionTotals.other;
  const maxChainCount = Math.max(...chainStats.map((s) => s.total), 1);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Rule Distribution
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No firewall rules configured
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 ${className || ''}`}>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        Rules by Chain
      </h3>
      <div className="space-y-3 mb-6">
        {chainStats.map((stat) => (
          <div key={stat.chain}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                {stat.chain}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {stat.total}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className={`${stat.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${(stat.total / maxChainCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        Actions
      </h3>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {totalActive > 0 && (
            <>
              {actionTotals.accept > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(actionTotals.accept / totalActive) * 100}%` }}
                />
              )}
              {actionTotals.drop > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(actionTotals.drop / totalActive) * 100}%` }}
                />
              )}
              {actionTotals.reject > 0 && (
                <div
                  className="bg-orange-500"
                  style={{ width: `${(actionTotals.reject / totalActive) * 100}%` }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Accept <span className="font-medium">{actionTotals.accept}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Drop <span className="font-medium">{actionTotals.drop}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Reject <span className="font-medium">{actionTotals.reject}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

























