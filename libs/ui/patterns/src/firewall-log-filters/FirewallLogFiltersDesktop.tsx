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
export const FirewallLogFiltersDesktop = memo(
  function FirewallLogFiltersDesktop({
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
      <aside className="w-80 border-r border-border bg-background p-4 space-y-6 overflow-y-auto">
        {/* Header with badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filters</h2>
            {hook.activeFilterCount > 0 && (
              <Badge variant="secondary">{hook.activeFilterCount}</Badge>
            )}
          </div>
          {hook.activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={hook.clearFilters}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Separator />

        {/* Time Range Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground">
              Showing logs from{' '}
              {hook.computedTimeRange.start.toLocaleTimeString()} to{' '}
              {hook.computedTimeRange.end.toLocaleTimeString()}
            </p>
          )}
        </div>

        <Separator />

        {/* Action Filters Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Action</Label>
          <div className="space-y-2">
            {(['accept', 'drop', 'reject', 'unknown'] as const).map(
              (action) => (
                <label
                  key={action}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                >
                  <Checkbox
                    checked={hook.filters.actions.includes(action)}
                    onCheckedChange={() => hook.toggleAction(action)}
                  />
                  <span className="text-sm capitalize">{action}</span>
                  {action === 'accept' && (
                    <Badge variant="success" className="ml-auto text-xs">
                      Allow
                    </Badge>
                  )}
                  {(action === 'drop' || action === 'reject') && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      Block
                    </Badge>
                  )}
                </label>
              )
            )}
          </div>
        </div>

        <Separator />

        {/* IP Address Filters Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">IP Addresses</Label>
          </div>

          <div className="space-y-2">
            <div>
              <Label htmlFor="srcIp" className="text-xs text-muted-foreground">
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
                <p className="text-xs text-destructive mt-1">
                  Invalid IP format
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dstIp" className="text-xs text-muted-foreground">
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
                <p className="text-xs text-destructive mt-1">
                  Invalid IP format
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Use * for wildcards (e.g., 192.168.1.*)
          </p>
        </div>

        <Separator />

        {/* Port Filters Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Ports</Label>
          </div>

          <div className="space-y-2">
            <div>
              <Label htmlFor="srcPort" className="text-xs text-muted-foreground">
                Source Port
              </Label>
              <Input
                id="srcPort"
                value={
                  typeof hook.filters.srcPort === 'number'
                    ? hook.filters.srcPort
                    : hook.filters.srcPort
                    ? `${hook.filters.srcPort.min}-${hook.filters.srcPort.max}`
                    : ''
                }
                onChange={(e) => hook.setSrcPort(e.target.value)}
                placeholder="80 or 8000-9000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dstPort" className="text-xs text-muted-foreground">
                Destination Port
              </Label>
              <Input
                id="dstPort"
                value={
                  typeof hook.filters.dstPort === 'number'
                    ? hook.filters.dstPort
                    : hook.filters.dstPort
                    ? `${hook.filters.dstPort.min}-${hook.filters.dstPort.max}`
                    : ''
                }
                onChange={(e) => hook.setDstPort(e.target.value)}
                placeholder="443 or 80-443"
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Single port (443) or range (80-443)
          </p>
        </div>

        <Separator />

        {/* Prefix Filter Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Log Prefix</Label>
          </div>

          {hook.availablePrefixes.length > 0 ? (
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
                  <SelectItem key={prefix} value={prefix}>
                    {prefix}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={hook.filters.prefix || ''}
              onChange={(e) => hook.setPrefix(e.target.value)}
              placeholder="DROPPED-, FIREWALL-"
            />
          )}
        </div>
      </aside>
    );
  }
);

FirewallLogFiltersDesktop.displayName = 'FirewallLogFiltersDesktop';
