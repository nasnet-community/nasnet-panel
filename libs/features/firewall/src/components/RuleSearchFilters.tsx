/**
 * Rule Search Filters Component
 * @description Filter panel for searching and filtering firewall rules with
 * debounced search, dropdown filters, active filter badges, and mobile collapse support.
 *
 * @example
 * <RuleSearchFilters
 *   filters={filters}
 *   onChange={handleFilterChange}
 *   onClearAll={handleClearAll}
 *   activeFilterCount={2}
 * />
 *
 * Epic 0.6 Enhancement: Advanced Rule Search
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { FirewallFilters, FirewallChain, FirewallAction, FirewallProtocol } from '@nasnet/core/types';

/**
 * Filter dropdown options
 * @internal
 */
const CHAIN_OPTIONS: { value: FirewallChain | 'all'; label: string }[] = [
  { value: 'all', label: 'All Chains' },
  { value: 'input', label: 'Input' },
  { value: 'forward', label: 'Forward' },
  { value: 'output', label: 'Output' },
  { value: 'prerouting', label: 'Prerouting' },
  { value: 'postrouting', label: 'Postrouting' },
];

const ACTION_OPTIONS: { value: FirewallAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All Actions' },
  { value: 'accept', label: 'Accept' },
  { value: 'drop', label: 'Drop' },
  { value: 'reject', label: 'Reject' },
  { value: 'log', label: 'Log' },
];

const PROTOCOL_OPTIONS: { value: FirewallProtocol | 'all'; label: string }[] = [
  { value: 'all', label: 'All Protocols' },
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
];

const STATUS_OPTIONS: { value: 'enabled' | 'disabled' | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

/**
 * Active filter badge component
 * @internal
 */
const FilterBadge = memo(function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-component-sm pr-1 cursor-pointer hover:bg-secondary',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      onClick={onRemove}
      role="button"
      tabIndex={0}
      aria-label={`Remove filter: ${label}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRemove();
        }
      }}
    >
      {label}
      <Icon
        icon={X}
        className={cn(
          'ml-1 w-3 h-3 text-muted-foreground',
          'group-hover:text-foreground'
        )}
        aria-hidden="true"
      />
    </Badge>
  );
});

export interface RuleSearchFiltersProps {
  /** CSS classes to apply to root element */
  className?: string;
  /** Current filter state */
  filters: FirewallFilters;
  /** Callback when any filter changes */
  onChange: (filters: Partial<FirewallFilters>) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Number of active filters (for badge display) */
  activeFilterCount: number;
}

/**
 * RuleSearchFilters Component
 *
 * Features:
 * - Text search with 300ms debouncing (comment, IPs, ports)
 * - Dropdown filters: chain, action, protocol, status
 * - Active filter badges with individual remove + clear all
 * - Mobile-optimized: collapsible filter panel with toggle button
 * - Accessibility: aria-labels, keyboard navigation
 *
 * @param props - Component props
 * @returns Rule search filters panel
 */
export const RuleSearchFilters = memo(function RuleSearchFilters({
  className,
  filters,
  onChange,
  onClearAll,
  activeFilterCount,
}: RuleSearchFiltersProps) {
  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onChange]);

  // Sync external filter changes back to local search input
  useEffect(() => {
    if (filters.search !== searchInput && filters.search !== undefined) {
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  // Handler for chain dropdown change
  const handleChainChange = useCallback(
    (value: string) => {
      onChange({ chain: value as FirewallChain | 'all' });
    },
    [onChange]
  );

  // Handler for action dropdown change
  const handleActionChange = useCallback(
    (value: string) => {
      onChange({ action: value as FirewallAction | 'all' });
    },
    [onChange]
  );

  // Handler for protocol dropdown change
  const handleProtocolChange = useCallback(
    (value: string) => {
      onChange({ protocol: value as FirewallProtocol | 'all' });
    },
    [onChange]
  );

  // Handler for status dropdown change
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
      <div className="px-component-sm mb-component-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold">Filter Rules</h2>
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
      <div className={cn(
        'bg-card rounded-[var(--semantic-radius-card)] border border-border p-component-md'
      )}>
        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-component-sm">
          {/* Search input */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by IP, port, or comment..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full"
              aria-label="Search firewall rules"
            />
          </div>

          {/* Toggle filters button (mobile) */}
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label="Toggle filter options"
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
          className={cn(
            'mt-component-sm grid grid-cols-2 md:grid-cols-4 gap-component-sm',
            isExpanded ? 'block' : 'hidden md:grid'
          )}
        >
          {/* Chain filter */}
          <Select value={filters.chain || 'all'} onValueChange={handleChainChange}>
            <SelectTrigger aria-label="Filter by chain">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              {CHAIN_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action filter */}
          <Select value={filters.action || 'all'} onValueChange={handleActionChange}>
            <SelectTrigger aria-label="Filter by action">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
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
            <SelectTrigger aria-label="Filter by protocol">
              <SelectValue placeholder="Protocol" />
            </SelectTrigger>
            <SelectContent>
              {PROTOCOL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mt-component-sm pt-component-sm border-t border-border">
            <div className="flex flex-wrap items-center gap-component-sm">
              <span className="text-xs text-muted-foreground">
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
                className="min-h-[44px] h-6 px-component-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={onClearAll}
                aria-label="Clear all filters"
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
RuleSearchFilters.displayName = 'RuleSearchFilters';



























