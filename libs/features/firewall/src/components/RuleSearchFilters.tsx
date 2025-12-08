/**
 * Rule Search Filters Component
 * Filter panel for searching and filtering firewall rules
 * Epic 0.6 Enhancement: Advanced Rule Search
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import type { FirewallFilters, FirewallChain, FirewallAction, FirewallProtocol } from '@nasnet/core/types';

/**
 * Filter options
 */
const chainOptions: { value: FirewallChain | 'all'; label: string }[] = [
  { value: 'all', label: 'All Chains' },
  { value: 'input', label: 'Input' },
  { value: 'forward', label: 'Forward' },
  { value: 'output', label: 'Output' },
  { value: 'prerouting', label: 'Prerouting' },
  { value: 'postrouting', label: 'Postrouting' },
];

const actionOptions: { value: FirewallAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'accept', label: 'Accept' },
  { value: 'drop', label: 'Drop' },
  { value: 'reject', label: 'Reject' },
  { value: 'log', label: 'Log' },
];

const protocolOptions: { value: FirewallProtocol | 'all'; label: string }[] = [
  { value: 'all', label: 'All Protocols' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
];

const statusOptions: { value: 'enabled' | 'disabled' | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

/**
 * Active filter badge
 */
function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 pr-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
      onClick={onRemove}
    >
      {label}
      <span className="ml-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        ×
      </span>
    </Badge>
  );
}

export interface RuleSearchFiltersProps {
  className?: string;
  filters: FirewallFilters;
  onChange: (filters: Partial<FirewallFilters>) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

/**
 * RuleSearchFilters Component
 *
 * Features:
 * - Text search with debouncing
 * - Filter by chain, action, protocol, status
 * - Active filter badges with remove functionality
 * - Clear all button
 * - Collapsible on mobile
 *
 * @param props - Component props
 * @returns Rule search filters component
 */
export function RuleSearchFilters({
  className,
  filters,
  onChange,
  onClearAll,
  activeFilterCount,
}: RuleSearchFiltersProps) {
  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onChange]);

  // Sync external changes to local state
  useEffect(() => {
    if (filters.search !== searchInput && filters.search !== undefined) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  const handleChainChange = useCallback(
    (value: string) => {
      onChange({ chain: value as FirewallChain | 'all' });
    },
    [onChange]
  );

  const handleActionChange = useCallback(
    (value: string) => {
      onChange({ action: value as FirewallAction | 'all' });
    },
    [onChange]
  );

  const handleProtocolChange = useCallback(
    (value: string) => {
      onChange({ protocol: value as FirewallProtocol | 'all' });
    },
    [onChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onChange({ status: value as 'enabled' | 'disabled' | 'all' });
    },
    [onChange]
  );

  // Build active filter badges
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.search && filters.search.length > 0) {
    activeFilters.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => {
        setSearchInput('');
        onChange({ search: '' });
      },
    });
  }

  if (filters.chain && filters.chain !== 'all') {
    activeFilters.push({
      key: 'chain',
      label: `Chain: ${filters.chain}`,
      onRemove: () => onChange({ chain: 'all' }),
    });
  }

  if (filters.action && filters.action !== 'all') {
    activeFilters.push({
      key: 'action',
      label: `Action: ${filters.action}`,
      onRemove: () => onChange({ action: 'all' }),
    });
  }

  if (filters.protocol && filters.protocol !== 'all') {
    activeFilters.push({
      key: 'protocol',
      label: `Protocol: ${filters.protocol}`,
      onRemove: () => onChange({ protocol: 'all' }),
    });
  }

  if (filters.status && filters.status !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${filters.status}`,
      onRemove: () => onChange({ status: 'all' }),
    });
  }

  return (
    <div className={className}>
      {/* Section header */}
      <div className="px-2 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Filter Rules</h2>
          <p className="text-sm text-muted-foreground">
            Search and filter firewall rules
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {activeFilterCount} active
          </Badge>
        )}
      </div>

      {/* Filter controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by IP, port, or comment..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Toggle filters button (mobile) */}
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter dropdowns */}
        <div
          className={`
            mt-3 grid grid-cols-2 md:grid-cols-4 gap-3
            ${isExpanded ? 'block' : 'hidden md:grid'}
          `}
        >
          {/* Chain filter */}
          <Select value={filters.chain || 'all'} onValueChange={handleChainChange}>
            <SelectTrigger>
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              {chainOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action filter */}
          <Select value={filters.action || 'all'} onValueChange={handleActionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Protocol filter */}
          <Select
            value={filters.protocol || 'all'}
            onValueChange={handleProtocolChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Protocol" />
            </SelectTrigger>
            <SelectContent>
              {protocolOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Active:
              </span>
              {activeFilters.map((filter) => (
                <FilterBadge
                  key={filter.key}
                  label={filter.label}
                  onRemove={filter.onRemove}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                onClick={onClearAll}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}







