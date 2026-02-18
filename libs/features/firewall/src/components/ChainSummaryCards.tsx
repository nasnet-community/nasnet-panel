/**
 * Chain Summary Cards Component
 * Displays aggregated statistics per firewall chain
 * Epic 0.6 Enhancement: Chain Summary Overview
 */

import { useFilterRules } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { FirewallChain, ChainSummary } from '@nasnet/core/types';
import { useChainSummary, getChainColor, getChainDescription } from '../hooks/useChainSummary';

/**
 * Progress bar for action distribution
 */
function ActionDistribution({ summary }: { summary: ChainSummary }) {
  const activeRules = summary.totalRules - summary.disabledCount;
  if (activeRules === 0) return null;

  const acceptPercent = (summary.acceptCount / summary.totalRules) * 100;
  const dropPercent = (summary.dropCount / summary.totalRules) * 100;
  const rejectPercent = (summary.rejectCount / summary.totalRules) * 100;

  return (
    <div className="mt-3">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {acceptPercent > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${acceptPercent}%` }}
            title={`${summary.acceptCount} accept`}
          />
        )}
        {dropPercent > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${dropPercent}%` }}
            title={`${summary.dropCount} drop`}
          />
        )}
        {rejectPercent > 0 && (
          <div
            className="bg-orange-500"
            style={{ width: `${rejectPercent}%` }}
            title={`${summary.rejectCount} reject`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Individual chain summary card
 */
function ChainCard({
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border-l-4 p-4 transition-all
        ${borderColors[colorName] || 'border-l-slate-500'}
        ${
          isSelected
            ? `${selectedBg[colorName] || 'bg-slate-50 dark:bg-slate-800'} ring-2 ring-primary-500/50`
            : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/50'
        }
        border border-slate-200 dark:border-slate-700
      `}
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
          <span className="block font-semibold text-green-600 dark:text-green-400">
            {summary.acceptCount}
          </span>
          <span className="text-slate-500 dark:text-slate-400">accept</span>
        </div>
        <div className="text-center">
          <span className="block font-semibold text-red-600 dark:text-red-400">
            {summary.dropCount}
          </span>
          <span className="text-slate-500 dark:text-slate-400">drop</span>
        </div>
        <div className="text-center">
          <span className="block font-semibold text-slate-500 dark:text-slate-400">
            {summary.disabledCount}
          </span>
          <span className="text-slate-500 dark:text-slate-400">disabled</span>
        </div>
      </div>

      {/* Action distribution bar */}
      <ActionDistribution summary={summary} />
    </button>
  );
}

export interface ChainSummaryCardsProps {
  className?: string;
  selectedChain?: FirewallChain | null;
  onChainSelect?: (chain: FirewallChain | null) => void;
}

/**
 * ChainSummaryCards Component
 *
 * Features:
 * - Displays summary statistics per firewall chain
 * - Color-coded cards (input=blue, forward=purple, output=amber)
 * - Shows accept/drop/disabled counts
 * - Visual action distribution bar
 * - Click to filter table below
 *
 * @param props - Component props
 * @returns Chain summary cards component
 */
export function ChainSummaryCards({
  className,
  selectedChain,
  onChainSelect,
}: ChainSummaryCardsProps) {
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
  const { data: rules, isLoading, error } = useFilterRules(routerIp);
  const summaries = useChainSummary(rules as any);

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="px-2 mb-4">
          <h2 className="text-lg font-semibold">Chain Summary</h2>
          <p className="text-sm text-muted-foreground">
            Filter rules by chain
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-4 text-red-600 dark:text-red-400 ${className || ''}`}>
        Error loading chain summary: {error.message}
      </div>
    );
  }

  // Filter to only show main chains (input, forward, output)
  const mainChains = summaries.filter((s) =>
    ['input', 'forward', 'output'].includes(s.chain)
  );

  // Calculate totals
  const totalRules = mainChains.reduce((sum, s) => sum + s.totalRules, 0);

  const handleChainClick = (chain: FirewallChain) => {
    if (onChainSelect) {
      // Toggle selection
      onChainSelect(selectedChain === chain ? null : chain);
    }
  };

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
      <div className="mt-3 px-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Accept
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          Drop
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
          Reject
        </span>
      </div>
    </div>
  );
}



























