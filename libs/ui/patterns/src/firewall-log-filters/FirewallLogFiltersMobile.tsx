/**
 * FirewallLogFiltersMobile - Mobile Platform Presenter
 *
 * Bottom sheet layout with card-based sections and 44px touch targets.
 * Optimized for touch interaction and vertical scrolling.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */

import { memo } from 'react';

import { Calendar, Filter, Network, Hash, Tag, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
} from '@nasnet/ui/primitives';

import { useFirewallLogFilters } from './use-firewall-log-filters';

import type { FirewallLogFiltersProps } from './firewall-log-filters.types';

/**
 * Mobile presenter for firewall log filters.
 *
 * Features:
 * - Bottom sheet with card-based sections
 * - 44px minimum touch targets (WCAG AAA)
 * - Vertical stacking for easy scrolling
 * - Sticky header with active filter count
 * - Bottom action bar with Apply/Clear buttons
 */
export const FirewallLogFiltersMobile = memo(function FirewallLogFiltersMobile({
  filters,
  onFiltersChange,
  availablePrefixes = [],
  open = false,
  onClose,
}: FirewallLogFiltersProps) {
  const hook = useFirewallLogFilters({
    filters,
    onFiltersChange,
    availablePrefixes,
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onClose}
    >
      <SheetContent
        side="bottom"
        className="flex h-[90vh] flex-col"
      >
        <SheetHeader className="border-border border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-5 w-5" />
              <SheetTitle>Filters</SheetTitle>
              {hook.activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 border"
                >
                  {hook.activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pb-20 pt-4">
          {/* Time Range Card */}
          <Card className="bg-muted/50 border-border space-y-3 border p-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <Label className="text-sm font-semibold">Time Range</Label>
            </div>
            <Select
              value={hook.filters.timeRangePreset}
              onValueChange={hook.setTimeRangePreset}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="1h"
                  className="h-11"
                >
                  Last Hour
                </SelectItem>
                <SelectItem
                  value="6h"
                  className="h-11"
                >
                  Last 6 Hours
                </SelectItem>
                <SelectItem
                  value="1d"
                  className="h-11"
                >
                  Last 24 Hours
                </SelectItem>
                <SelectItem
                  value="1w"
                  className="h-11"
                >
                  Last 7 Days
                </SelectItem>
                <SelectItem
                  value="custom"
                  className="h-11"
                >
                  Custom Range
                </SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* Action Filters Card */}
          <Card className="bg-muted/50 border-border space-y-3 border p-4">
            <Label className="text-sm font-semibold">Action</Label>
            <div className="space-y-2">
              {(['accept', 'drop', 'reject', 'unknown'] as const).map((action) => (
                <label
                  key={action}
                  className="hover:bg-accent/50 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md p-3 transition-colors"
                >
                  <Checkbox
                    checked={hook.filters.actions.includes(action)}
                    onCheckedChange={() => hook.toggleAction(action)}
                  />
                  <span className="flex-1 text-sm capitalize">{action}</span>
                  {action === 'accept' && (
                    <Badge
                      variant="success"
                      className="text-xs"
                    >
                      Allow
                    </Badge>
                  )}
                  {(action === 'drop' || action === 'reject') && (
                    <Badge
                      variant="error"
                      className="text-xs"
                    >
                      Block
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </Card>

          {/* IP Address Filters Card */}
          <Card className="bg-muted/50 border-border space-y-3 border p-4">
            <div className="flex items-center gap-2">
              <Network className="text-muted-foreground h-4 w-4" />
              <Label className="text-sm font-semibold">IP Addresses</Label>
            </div>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="srcIp-mobile"
                  className="text-muted-foreground text-xs"
                >
                  Source IP
                </Label>
                <Input
                  id="srcIp-mobile"
                  value={hook.filters.srcIp || ''}
                  onChange={(e) => hook.setSrcIp(e.target.value)}
                  placeholder="192.168.1.*"
                  className="mt-1 h-11"
                />
                {hook.filters.srcIp && !hook.isValidIpFilter(hook.filters.srcIp) && (
                  <p className="text-destructive mt-1 text-xs">Invalid IP format</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="dstIp-mobile"
                  className="text-muted-foreground text-xs"
                >
                  Destination IP
                </Label>
                <Input
                  id="dstIp-mobile"
                  value={hook.filters.dstIp || ''}
                  onChange={(e) => hook.setDstIp(e.target.value)}
                  placeholder="10.0.*.*"
                  className="mt-1 h-11"
                />
                {hook.filters.dstIp && !hook.isValidIpFilter(hook.filters.dstIp) && (
                  <p className="text-destructive mt-1 text-xs">Invalid IP format</p>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-xs">Use * for wildcards</p>
          </Card>

          {/* Port Filters Card */}
          <Card className="bg-muted/50 border-border space-y-3 border p-4">
            <div className="flex items-center gap-2">
              <Hash className="text-muted-foreground h-4 w-4" />
              <Label className="text-sm font-semibold">Ports</Label>
            </div>

            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="srcPort-mobile"
                  className="text-muted-foreground text-xs"
                >
                  Source Port
                </Label>
                <Input
                  id="srcPort-mobile"
                  value={
                    typeof hook.filters.srcPort === 'number' ? hook.filters.srcPort
                    : hook.filters.srcPort ?
                      `${hook.filters.srcPort.min}-${hook.filters.srcPort.max}`
                    : ''
                  }
                  onChange={(e) => hook.setSrcPort(e.target.value)}
                  placeholder="80 or 8000-9000"
                  className="mt-1 h-11"
                />
              </div>

              <div>
                <Label
                  htmlFor="dstPort-mobile"
                  className="text-muted-foreground text-xs"
                >
                  Destination Port
                </Label>
                <Input
                  id="dstPort-mobile"
                  value={
                    typeof hook.filters.dstPort === 'number' ? hook.filters.dstPort
                    : hook.filters.dstPort ?
                      `${hook.filters.dstPort.min}-${hook.filters.dstPort.max}`
                    : ''
                  }
                  onChange={(e) => hook.setDstPort(e.target.value)}
                  placeholder="443 or 80-443"
                  className="mt-1 h-11"
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">Single or range (80-443)</p>
          </Card>

          {/* Prefix Filter Card */}
          <Card className="bg-muted/50 border-border space-y-3 border p-4">
            <div className="flex items-center gap-2">
              <Tag className="text-muted-foreground h-4 w-4" />
              <Label className="text-sm font-semibold">Log Prefix</Label>
            </div>

            {hook.availablePrefixes.length > 0 ?
              <Select
                value={hook.filters.prefix || ''}
                onValueChange={hook.setPrefix}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select prefix..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value=""
                    className="h-11"
                  >
                    All Prefixes
                  </SelectItem>
                  {hook.availablePrefixes.map((prefix) => (
                    <SelectItem
                      key={prefix}
                      value={prefix}
                      className="h-11"
                    >
                      {prefix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            : <Input
                value={hook.filters.prefix || ''}
                onChange={(e) => hook.setPrefix(e.target.value)}
                placeholder="DROPPED-"
                className="h-11"
              />
            }
          </Card>
        </div>

        <SheetFooter className="bg-background fixed bottom-0 left-0 right-0 space-y-2 border-t p-4">
          {hook.activeFilterCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={hook.clearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          )}
          <Button
            type="button"
            className="h-11 w-full"
            onClick={onClose}
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

FirewallLogFiltersMobile.displayName = 'FirewallLogFiltersMobile';
