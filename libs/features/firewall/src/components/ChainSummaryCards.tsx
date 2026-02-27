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
    <div className="mt-component-md">
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
            className="bg-error"
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
    blue: 'border-l-info',
    purple: 'border-l-secondary',
    amber: 'border-l-primary',
    teal: 'border-l-success',
    rose: 'border-l-error',
  };

  const selectedBg: Record<string, string> = {
    blue: 'bg-info/10',
    purple: 'bg-secondary/10',
    amber: 'bg-primary/10',
    teal: 'bg-success/10',
    rose: 'bg-error/10',
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
        'w-full text-left rounded-xl border-l-4 p-component-md transition-all',
        borderColors[colorName] || 'border-l-muted-foreground',
        isSelected
          ? `${selectedBg[colorName] || 'bg-muted/50'} ring-2 ring-primary/50`
          : 'bg-card hover:bg-muted/50',
        'border border-border'
      )}
    >
      {/* Chain name and count */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground uppercase text-sm tracking-wide">
            {summary.chain}
          </h3>
          <p className="text-xs text-muted-foreground mt-component-xs">
            {description}
          </p>
        </div>
        <span className="text-2xl font-bold text-foreground">
          {summary.totalRules}
        </span>
      </div>

      {/* Stats grid */}
      <div className="mt-component-md grid grid-cols-3 gap-component-sm text-xs">
        <div className="text-center">
          <span className="block font-semibold text-success">
            {summary.acceptCount}
          </span>
          <span className="text-muted-foreground">accept</span>
        </div>
        <div className="text-center">
          <span className="block font-semibold text-error">
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
        <div className="px-component-sm mb-component-lg">
          <h2 className="text-lg font-semibold">Chain Summary</h2>
          <p className="text-sm text-muted-foreground">
            Loading firewall chain statistics
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-component-lg">
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
        className={cn('p-component-md text-error rounded-lg bg-error/10', className)}
        role="alert"
      >
        <p className="font-medium">Error Loading Chain Summary</p>
        <p className="text-sm mt-component-xs">{error instanceof Error ? error.message : 'Failed to load firewall statistics'}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-component-sm mb-component-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Chain Summary</h2>
          <p className="text-sm text-muted-foreground">
            {selectedChain
              ? `Filtering by ${selectedChain} chain`
              : 'Click a chain to filter rules'}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {totalRules}
          </span>{' '}
          total rules
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-component-lg">
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
      <div className="mt-component-md px-component-sm flex items-center gap-component-lg text-xs text-muted-foreground">
        <span className="flex items-center gap-component-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-success" aria-hidden="true" />
          Accept
        </span>
        <span className="flex items-center gap-component-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-error" aria-hidden="true" />
          Drop
        </span>
        <span className="flex items-center gap-component-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
          Reject
        </span>
      </div>
    </div>
  );
});

ChainSummaryCards.displayName = 'ChainSummaryCards';
export { ChainSummaryCards };



























