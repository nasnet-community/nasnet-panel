/**
 * Chain Summary Cards Component
 * Displays aggregated statistics per firewall chain
 * Epic 0.6 Enhancement: Chain Summary Overview
 */

import React, { useCallback, useMemo } from 'react';
import { useFilterRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallChain, ChainSummary } from '@nasnet/core/types';
import { useChainSummary, getChainColor, getChainDescription } from '../hooks/useChainSummary';
import { cn } from '@nasnet/ui/utils';

/**
 * Progress bar for action distribution
 */
const ActionDistribution = React.memo(function ActionDistribution({
  summary,
}: {
  summary: ChainSummary;
}) {
  const acceptPercent = useMemo(
    () => (summary.acceptCount / summary.totalRules) * 100,
    [summary.acceptCount, summary.totalRules]
  );
  const dropPercent = useMemo(
    () => (summary.dropCount / summary.totalRules) * 100,
    [summary.dropCount, summary.totalRules]
  );
  const rejectPercent = useMemo(
    () => (summary.rejectCount / summary.totalRules) * 100,
    [summary.rejectCount, summary.totalRules]
  );

  const activeRules = summary.totalRules - summary.disabledCount;
  if (activeRules === 0) return null;

  return (
    <div className="mt-3">
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Action distribution: ${summary.acceptCount} accept, ${summary.dropCount} drop, ${summary.rejectCount} reject`}
      >
        {acceptPercent > 0 && (
          <div
            className="bg-success"
            style={{ width: `${acceptPercent}%` }}
            title={`${summary.acceptCount} accept`}
          />
        )}
        {dropPercent > 0 && (
          <div
            className="bg-destructive"
            style={{ width: `${dropPercent}%` }}
            title={`${summary.dropCount} drop`}
          />
        )}
        {rejectPercent > 0 && (
          <div
            className="bg-warning"
            style={{ width: `${rejectPercent}%` }}
            title={`${summary.rejectCount} reject`}
          />
        )}
      </div>
    </div>
  );
});

/**
 * Individual chain summary card
 */
const ChainCard = React.memo(function ChainCard({
  summary,
  isSelected,
  onClick,
}: {
  summary: ChainSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colorName = getChainColor(summary.chain);
  const description = getChainDescription(summary.chain);

  // Dynamic border color based on chain
  const borderColors: Record<string, string> = {
    blue: 'border-l-blue-500',
    purple: 'border-l-purple-500',
    amber: 'border-l-amber-500',
    teal: 'border-l-teal-500',
    rose: 'border-l-rose-500',
  };

  const selectedBg: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    purple: 'bg-purple-50 dark:bg-purple-950/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30',
    teal: 'bg-teal-50 dark:bg-teal-950/30',
    rose: 'bg-rose-50 dark:bg-rose-950/30',
  };

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSelected}
      className={cn(
        'w-full text-left rounded-xl border-l-4 p-4 transition-all',
        borderColors[colorName] || 'border-l-slate-500',
        isSelected
          ? `${selectedBg[colorName] || 'bg-slate-50 dark:bg-slate-800'} ring-2 ring-primary/50`
          : 'bg-card hover:bg-muted/50 dark:bg-slate-800 dark:hover:bg-slate-700/50',
        'border border-border dark:border-slate-700'
      )}
    >
      {/* Chain name and count */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-sm tracking-wide">
            {summary.chain}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {summary.totalRules}
        </span>
      </div>

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <span className="block font-semibold text-success">
            {summary.acceptCount}
          </span>
          <span className="text-muted-foreground">accept</span>
        </div>
        <div className="text-center">
          <span className="block font-semibold text-destructive">
            {summary.dropCount}
          </span>
          <span className="text-muted-foreground">drop</span>
        </div>
        <div className="text-center">
          <span className="block font-semibold text-muted-foreground">
            {summary.disabledCount}
          </span>
          <span className="text-muted-foreground">disabled</span>
        </div>
      </div>

      {/* Action distribution bar */}
      <ActionDistribution summary={summary} />
    </button>
  );
});

export interface ChainSummaryCardsProps {
  className?: string;
  selectedChain?: FirewallChain | null;
  onChainSelect?: (chain: FirewallChain | null) => void;
}

/**
 * ChainSummaryCards Component
 *
 * Displays summary statistics per firewall chain with visual indicators.
 * Features color-coded cards (input=blue, forward=purple, output=amber),
 * accept/drop/disabled counts, and visual action distribution bars.
 *
 * @param props - Component props
 * @returns Chain summary cards component
 */
const ChainSummaryCards = React.memo(function ChainSummaryCards({
  className,
  selectedChain,
  onChainSelect,
}: ChainSummaryCardsProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules, isLoading, error } = useFilterRules(routerIp);
  const summaries = useChainSummary(rules as any);

  const handleChainClick = useCallback(
    (chain: FirewallChain) => {
      if (onChainSelect) {
        // Toggle selection
        onChainSelect(selectedChain === chain ? null : chain);
      }
    },
    [selectedChain, onChainSelect]
  );

  const mainChains = useMemo(
    () =>
      summaries.filter((s) => ['input', 'forward', 'output'].includes(s.chain)),
    [summaries]
  );

  const totalRules = useMemo(
    () => mainChains.reduce((sum, s) => sum + s.totalRules, 0),
    [mainChains]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="px-2 mb-4">
          <h2 className="text-lg font-semibold">Chain Summary</h2>
          <p className="text-sm text-muted-foreground">
            Loading firewall chain statistics
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse bg-muted rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn('p-4 text-destructive rounded-lg bg-destructive/10', className)}
        role="alert"
      >
        <p className="font-medium">Error Loading Chain Summary</p>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Failed to load firewall statistics'}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-2 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Chain Summary</h2>
          <p className="text-sm text-muted-foreground">
            {selectedChain
              ? `Filtering by ${selectedChain} chain`
              : 'Click a chain to filter rules'}
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {totalRules}
          </span>{' '}
          total rules
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mainChains.map((summary) => (
          <ChainCard
            key={summary.chain}
            summary={summary}
            isSelected={selectedChain === summary.chain}
            onClick={() => handleChainClick(summary.chain)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 px-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          Accept
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-destructive" aria-hidden="true" />
          Drop
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
          Reject
        </span>
      </div>
    </div>
  );
});

ChainSummaryCards.displayName = 'ChainSummaryCards';
export { ChainSummaryCards };



























