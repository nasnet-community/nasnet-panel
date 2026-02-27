/**
 * FirewallLogFiltersDesktop - Desktop Platform Presenter
 *
 * Sidebar layout with inline filter controls optimized for mouse/keyboard.
 * Dense layout with grouped sections for efficient filtering.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import { memo } from 'react';

import { Calendar, Filter, Network, Hash, Tag, X } from 'lucide-react';

import {
  Card,
  Label,
  Button,
  Badge,
  Checkbox,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from '@nasnet/ui/primitives';

import { useFirewallLogFilters } from './use-firewall-log-filters';

import type { FirewallLogFiltersProps } from './firewall-log-filters.types';

/**
 * Desktop presenter for firewall log filters.
 *
 * Features:
 * - Sidebar layout with grouped filter sections
 * - Time range presets with inline selection
 * - Action checkboxes with visual indicators
 * - IP inputs with wildcard hint
 * - Port inputs with range support
 * - Prefix autocomplete dropdown
 * - Active filter count badge
 * - Clear filters button
 */
export const FirewallLogFiltersDesktop = memo(function FirewallLogFiltersDesktop({
  filters,
  onFiltersChange,
  availablePrefixes = [],
}: FirewallLogFiltersProps) {
  const hook = useFirewallLogFilters({
    filters,
    onFiltersChange,
    availablePrefixes,
  });

  return (
    <aside className="border-border bg-card w-80 space-y-6 overflow-y-auto border-r p-4">
      {/* Header with badge */}
      <div className="border-border flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-5 w-5" />
          <h2 className="text-lg font-semibold">Filters</h2>
          {hook.activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 border"
            >
              {hook.activeFilterCount}
            </Badge>
          )}
        </div>
        {hook.activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={hook.clearFilters}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Time Range Section */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">Time Range</Label>
        </div>
        <Select
          value={hook.filters.timeRangePreset}
          onValueChange={hook.setTimeRangePreset}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="6h">Last 6 Hours</SelectItem>
            <SelectItem value="1d">Last 24 Hours</SelectItem>
            <SelectItem value="1w">Last 7 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        {hook.filters.timeRangePreset !== 'custom' && (
          <p className="text-muted-foreground text-xs">
            Showing logs from {hook.computedTimeRange.start.toLocaleTimeString()} to{' '}
            {hook.computedTimeRange.end.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Action Filters Section */}
      <div className="border-border space-y-3 border-t pt-4">
        <Label className="text-sm font-medium">Action</Label>
        <div className="space-y-2">
          {(['accept', 'drop', 'reject', 'unknown'] as const).map((action) => (
            <label
              key={action}
              className="hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors"
            >
              <Checkbox
                checked={hook.filters.actions.includes(action)}
                onCheckedChange={() => hook.toggleAction(action)}
              />
              <span className="text-sm capitalize">{action}</span>
              {action === 'accept' && (
                <Badge
                  variant="success"
                  className="ml-auto text-xs"
                >
                  Allow
                </Badge>
              )}
              {(action === 'drop' || action === 'reject') && (
                <Badge
                  variant="error"
                  className="ml-auto text-xs"
                >
                  Block
                </Badge>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* IP Address Filters Section */}
      <div className="border-border space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Network className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">IP Addresses</Label>
        </div>

        <div className="space-y-2">
          <div>
            <Label
              htmlFor="srcIp"
              className="text-muted-foreground text-xs"
            >
              Source IP
            </Label>
            <Input
              id="srcIp"
              value={hook.filters.srcIp || ''}
              onChange={(e) => hook.setSrcIp(e.target.value)}
              placeholder="192.168.1.* or 10.0.0.1"
              className="mt-1"
            />
            {hook.filters.srcIp && !hook.isValidIpFilter(hook.filters.srcIp) && (
              <p className="text-destructive mt-1 text-xs">Invalid IP format</p>
            )}
          </div>

          <div>
            <Label
              htmlFor="dstIp"
              className="text-muted-foreground text-xs"
            >
              Destination IP
            </Label>
            <Input
              id="dstIp"
              value={hook.filters.dstIp || ''}
              onChange={(e) => hook.setDstIp(e.target.value)}
              placeholder="10.0.*.* or 172.16.0.1"
              className="mt-1"
            />
            {hook.filters.dstIp && !hook.isValidIpFilter(hook.filters.dstIp) && (
              <p className="text-destructive mt-1 text-xs">Invalid IP format</p>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Tip: Use * for wildcards (e.g., 192.168.1.*)
        </p>
      </div>

      {/* Port Filters Section */}
      <div className="border-border space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Hash className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">Ports</Label>
        </div>

        <div className="space-y-2">
          <div>
            <Label
              htmlFor="srcPort"
              className="text-muted-foreground text-xs"
            >
              Source Port
            </Label>
            <Input
              id="srcPort"
              value={
                typeof hook.filters.srcPort === 'number' ? hook.filters.srcPort
                : hook.filters.srcPort ?
                  `${hook.filters.srcPort.min}-${hook.filters.srcPort.max}`
                : ''
              }
              onChange={(e) => hook.setSrcPort(e.target.value)}
              placeholder="80 or 8000-9000"
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="dstPort"
              className="text-muted-foreground text-xs"
            >
              Destination Port
            </Label>
            <Input
              id="dstPort"
              value={
                typeof hook.filters.dstPort === 'number' ? hook.filters.dstPort
                : hook.filters.dstPort ?
                  `${hook.filters.dstPort.min}-${hook.filters.dstPort.max}`
                : ''
              }
              onChange={(e) => hook.setDstPort(e.target.value)}
              placeholder="443 or 80-443"
              className="mt-1"
            />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Single port (443) or range (80-443)</p>
      </div>

      {/* Prefix Filter Section */}
      <div className="border-border space-y-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Tag className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">Log Prefix</Label>
        </div>

        {hook.availablePrefixes.length > 0 ?
          <Select
            value={hook.filters.prefix || ''}
            onValueChange={hook.setPrefix}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select prefix..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Prefixes</SelectItem>
              {hook.availablePrefixes.map((prefix) => (
                <SelectItem
                  key={prefix}
                  value={prefix}
                >
                  {prefix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        : <Input
            value={hook.filters.prefix || ''}
            onChange={(e) => hook.setPrefix(e.target.value)}
            placeholder="DROPPED-, FIREWALL-"
          />
        }
      </div>
    </aside>
  );
});

FirewallLogFiltersDesktop.displayName = 'FirewallLogFiltersDesktop';
