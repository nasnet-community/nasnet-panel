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
export const FirewallLogFiltersMobile = memo(
  function FirewallLogFiltersMobile({
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
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <SheetTitle>Filters</SheetTitle>
                {hook.activeFilterCount > 0 && (
                  <Badge variant="secondary">{hook.activeFilterCount}</Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-4 pb-20">
            {/* Time Range Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
                  <SelectItem value="1h" className="h-11">
                    Last Hour
                  </SelectItem>
                  <SelectItem value="6h" className="h-11">
                    Last 6 Hours
                  </SelectItem>
                  <SelectItem value="1d" className="h-11">
                    Last 24 Hours
                  </SelectItem>
                  <SelectItem value="1w" className="h-11">
                    Last 7 Days
                  </SelectItem>
                  <SelectItem value="custom" className="h-11">
                    Custom Range
                  </SelectItem>
                </SelectContent>
              </Select>
            </Card>

            {/* Action Filters Card */}
            <Card className="p-4 space-y-3">
              <Label className="text-sm font-semibold">Action</Label>
              <div className="space-y-2">
                {(['accept', 'drop', 'reject', 'unknown'] as const).map(
                  (action) => (
                    <label
                      key={action}
                      className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-3 rounded-md transition-colors min-h-[44px]"
                    >
                      <Checkbox
                        checked={hook.filters.actions.includes(action)}
                        onCheckedChange={() => hook.toggleAction(action)}
                      />
                      <span className="text-sm capitalize flex-1">{action}</span>
                      {action === 'accept' && (
                        <Badge variant="success" className="text-xs">
                          Allow
                        </Badge>
                      )}
                      {(action === 'drop' || action === 'reject') && (
                        <Badge variant="destructive" className="text-xs">
                          Block
                        </Badge>
                      )}
                    </label>
                  )
                )}
              </div>
            </Card>

            {/* IP Address Filters Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">IP Addresses</Label>
              </div>

              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="srcIp-mobile"
                    className="text-xs text-muted-foreground"
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
                  {hook.filters.srcIp &&
                    !hook.isValidIpFilter(hook.filters.srcIp) && (
                      <p className="text-xs text-destructive mt-1">
                        Invalid IP format
                      </p>
                    )}
                </div>

                <div>
                  <Label
                    htmlFor="dstIp-mobile"
                    className="text-xs text-muted-foreground"
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
                  {hook.filters.dstIp &&
                    !hook.isValidIpFilter(hook.filters.dstIp) && (
                      <p className="text-xs text-destructive mt-1">
                        Invalid IP format
                      </p>
                    )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use * for wildcards
              </p>
            </Card>

            {/* Port Filters Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Ports</Label>
              </div>

              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="srcPort-mobile"
                    className="text-xs text-muted-foreground"
                  >
                    Source Port
                  </Label>
                  <Input
                    id="srcPort-mobile"
                    value={
                      typeof hook.filters.srcPort === 'number'
                        ? hook.filters.srcPort
                        : hook.filters.srcPort
                        ? `${hook.filters.srcPort.min}-${hook.filters.srcPort.max}`
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
                    className="text-xs text-muted-foreground"
                  >
                    Destination Port
                  </Label>
                  <Input
                    id="dstPort-mobile"
                    value={
                      typeof hook.filters.dstPort === 'number'
                        ? hook.filters.dstPort
                        : hook.filters.dstPort
                        ? `${hook.filters.dstPort.min}-${hook.filters.dstPort.max}`
                        : ''
                    }
                    onChange={(e) => hook.setDstPort(e.target.value)}
                    placeholder="443 or 80-443"
                    className="mt-1 h-11"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Single or range (80-443)
              </p>
            </Card>

            {/* Prefix Filter Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Log Prefix</Label>
              </div>

              {hook.availablePrefixes.length > 0 ? (
                <Select
                  value={hook.filters.prefix || ''}
                  onValueChange={hook.setPrefix}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select prefix..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="h-11">
                      All Prefixes
                    </SelectItem>
                    {hook.availablePrefixes.map((prefix) => (
                      <SelectItem key={prefix} value={prefix} className="h-11">
                        {prefix}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={hook.filters.prefix || ''}
                  onChange={(e) => hook.setPrefix(e.target.value)}
                  placeholder="DROPPED-"
                  className="h-11"
                />
              )}
            </Card>
          </div>

          <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t space-y-2">
            {hook.activeFilterCount > 0 && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={hook.clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
            <Button
              type="button"
              className="w-full h-11"
              onClick={onClose}
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }
);

FirewallLogFiltersMobile.displayName = 'FirewallLogFiltersMobile';
