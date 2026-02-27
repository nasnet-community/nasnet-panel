/**
 * Firewall Quick Stats Component
 * Compact summary of chain and action distribution
 * Epic 0.6 Enhancement: Dashboard Overview
 */

import React, { useMemo } from 'react';
import { useFilterRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallRule } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/utils';

export interface FirewallQuickStatsProps {
  className?: string;
}

const CHAIN_ORDER = ['input', 'forward', 'output'] as const;
const CHAIN_COLOR_MAP: Record<string, string> = {
  input: 'bg-info',
  forward: 'bg-warning',
  output: 'bg-success',
};

interface ChainStats {
  chain: string;
  total: number;
  accept: number;
  drop: number;
  reject: number;
  disabled: number;
  color: string;
}

/**
 * FirewallQuickStats Component
 *
 * Compact summary of firewall chain and action distribution.
 * Displays rule counts per chain and overall action breakdown.
 *
 * @param props - Component props
 * @returns Quick stats component
 */
function FirewallQuickStatsContent({ className }: FirewallQuickStatsProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules, isLoading } = useFilterRules(routerIp);

  const chainStats = useMemo(() => {
    if (!rules || rules.length === 0) return [];

    const stats: Record<string, ChainStats> = {};

    (rules as FirewallRule[]).forEach((rule: FirewallRule) => {
      if (!stats[rule.chain]) {
        stats[rule.chain] = {
          chain: rule.chain,
          total: 0,
          accept: 0,
          drop: 0,
          reject: 0,
          disabled: 0,
          color: CHAIN_COLOR_MAP[rule.chain] || 'bg-muted',
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

    return Object.values(stats).sort((a, b) => {
      const aIndex = CHAIN_ORDER.indexOf(a.chain as any);
      const bIndex = CHAIN_ORDER.indexOf(b.chain as any);
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
      <div className={cn('bg-card rounded-[var(--semantic-radius-card)] border border-border p-component-md', className)}>
        <div className="animate-pulse space-y-component-md">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="space-y-component-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-component-sm">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-2 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className={cn('bg-card rounded-[var(--semantic-radius-card)] border border-border p-component-md', className)}>
        <h3 className="text-sm font-semibold text-foreground mb-component-sm">
          Firewall Rules
        </h3>
        <p className="text-sm text-muted-foreground">
          No firewall rules configured. Create rules to manage traffic filtering.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-[var(--semantic-radius-card)] border border-border p-component-md', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-component-md">
        Rules by Chain
      </h3>
      <div className="space-y-component-md mb-component-lg">
        {chainStats.map((stat) => (
          <div key={stat.chain}>
            <div className="flex items-center justify-between mb-component-xs">
              <span className="text-xs font-medium text-foreground uppercase">
                {stat.chain}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {stat.total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-[var(--semantic-radius-badge)] h-2">
              <div
                className={cn(stat.color, 'h-2 rounded-[var(--semantic-radius-badge)] transition-all duration-300')}
                style={{ width: `${(stat.total / maxChainCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-component-md">
        Action Totals
      </h3>
      <div className="flex items-center gap-component-sm mb-component-sm">
        <div
          className="flex-1 flex h-3 rounded-[var(--semantic-radius-badge)] overflow-hidden bg-muted"
          role="img"
          aria-label={`Action distribution: ${actionTotals.accept} accept, ${actionTotals.drop} drop, ${actionTotals.reject} reject`}
        >
          {totalActive > 0 && (
            <>
              {actionTotals.accept > 0 && (
                <div
                  className="bg-success"
                  style={{ width: `${(actionTotals.accept / totalActive) * 100}%` }}
                />
              )}
              {actionTotals.drop > 0 && (
                <div
                  className="bg-error"
                  style={{ width: `${(actionTotals.drop / totalActive) * 100}%` }}
                />
              )}
              {actionTotals.reject > 0 && (
                <div
                  className="bg-warning"
                  style={{ width: `${(actionTotals.reject / totalActive) * 100}%` }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-component-sm text-xs">
        <div className="flex items-center gap-component-xs">
          <span className="w-2.5 h-2.5 rounded-[var(--semantic-radius-badge)] bg-success" aria-hidden="true" />
          <span className="text-muted-foreground">
            Accept <span className="font-medium">{actionTotals.accept}</span>
          </span>
        </div>
        <div className="flex items-center gap-component-xs">
          <span className="w-2.5 h-2.5 rounded-[var(--semantic-radius-badge)] bg-error" aria-hidden="true" />
          <span className="text-muted-foreground">
            Drop <span className="font-medium">{actionTotals.drop}</span>
          </span>
        </div>
        <div className="flex items-center gap-component-xs">
          <span className="w-2.5 h-2.5 rounded-[var(--semantic-radius-badge)] bg-warning" aria-hidden="true" />
          <span className="text-muted-foreground">
            Reject <span className="font-medium">{actionTotals.reject}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export const FirewallQuickStats = React.memo(FirewallQuickStatsContent);
FirewallQuickStats.displayName = 'FirewallQuickStats';

























