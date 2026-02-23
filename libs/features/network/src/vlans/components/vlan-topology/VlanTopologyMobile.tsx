/**
 * VLAN Topology Mobile Presenter
 *
 * Card-based vertical layout for VLAN topology visualization on mobile devices (<640px).
 * Displays parent interfaces with expandable VLAN lists, statistics, and per-VLAN status badges.
 *
 * @description
 * This component presents VLAN topology data optimized for mobile viewing:
 * - Vertical card layout (no horizontal scrolling)
 * - Tap-to-expand interface hierarchy
 * - Quick stats overview (total, running, disabled, interfaces)
 * - Status badges (running/disabled/down) per VLAN
 * - VLAN ID displayed in monospace font for technical clarity
 *
 * @example
 * ```tsx
 * <VlanTopologyMobile
 *   topology={topology}
 *   stats={stats}
 *   loading={false}
 *   error={null}
 *   onVlanSelect={handleSelect}
 * />
 * ```
 */

import { useState, useCallback, useMemo, memo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Icon,
} from '@nasnet/ui/primitives';
import { Network, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { UseVlanTopologyReturn } from '../../hooks/use-vlan-topology';

export interface VlanTopologyMobileProps extends UseVlanTopologyReturn {
  /** Router ID for context */
  routerId: string;
  /** Callback when a VLAN is selected */
  onVlanSelect?: (vlanId: string) => void;
  /** Optional CSS classes */
  className?: string;
}

/**
 * VlanTopologyMobile component - Render function
 */
function VlanTopologyMobileComponent({
  topology,
  stats,
  isLoading,
  error,
  onVlanSelect,
  className,
}: VlanTopologyMobileProps) {
  const [expandedInterfaces, setExpandedInterfaces] = useState<Set<string>>(
    new Set(topology.map((iface) => iface.id))
  );

  const handleToggleInterface = useCallback((interfaceId: string) => {
    setExpandedInterfaces((prev) => {
      const next = new Set(prev);
      if (next.has(interfaceId)) {
        next.delete(interfaceId);
      } else {
        next.add(interfaceId);
      }
      return next;
    });
  }, []);

  const handleVlanSelect = useCallback(
    (vlanId: string) => {
      onVlanSelect?.(vlanId);
    },
    [onVlanSelect]
  );

  // Memoize the empty state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading VLAN topology...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <p className="text-center text-destructive">
            Failed to load VLAN topology: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topology.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Icon
            icon={Network}
            className="h-12 w-12 mx-auto mb-4 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">No VLANs configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4 pb-20', className)}>
      {/* Statistics Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon
              icon={Network}
              className="h-5 w-5"
              aria-hidden="true"
            />
            VLAN Topology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Total VLANs</p>
              <p className="text-2xl font-bold">{stats.totalVlans}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold text-success">
                {stats.runningVlans}
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {stats.disabledVlans}
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Interfaces</p>
              <p className="text-2xl font-bold">{stats.parentInterfaces}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent Interfaces */}
      {topology.map((iface) => {
        const isExpanded = expandedInterfaces.has(iface.id);

        return (
          <Card key={iface.id}>
            {/* Parent Interface Header */}
            <button
              onClick={() => handleToggleInterface(iface.id)}
              className="w-full"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} VLANs on ${iface.name}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <Icon
                      icon={ChevronDown}
                      className="h-5 w-5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon
                      icon={ChevronRight}
                      className="h-5 w-5 text-muted-foreground shrink-0"
                      aria-hidden="true"
                    />
                  )}

                  <div className="flex-1 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={Network}
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="text-left">
                        <CardTitle className="text-base font-mono">
                          {iface.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {iface.type}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="shrink-0">
                      {iface.vlans.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* VLANs List */}
            {isExpanded && iface.vlans.length > 0 && (
              <CardContent className="pt-0 space-y-2">
                {iface.vlans.map((vlan) => (
                  <button
                    key={vlan.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVlanSelect(vlan.id);
                    }}
                    className="w-full p-3 rounded-lg border hover:border-primary/50 transition-all text-left"
                    aria-label={`Select VLAN ${vlan.vlanId}: ${vlan.name}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono min-w-[50px] justify-center shrink-0"
                          >
                            {vlan.vlanId}
                          </Badge>
                          <p className="font-medium">{vlan.name}</p>
                        </div>

                        {vlan.isDisabled ? (
                          <Badge variant="secondary" className="shrink-0">
                            Disabled
                          </Badge>
                        ) : vlan.isRunning ? (
                          <Badge variant="success" className="shrink-0">
                            Running
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="shrink-0">
                            Down
                          </Badge>
                        )}
                      </div>

                      {vlan.comment && (
                        <p className="text-sm text-muted-foreground">
                          {vlan.comment}
                        </p>
                      )}

                      {vlan.mtu && (
                        <Badge variant="outline" className="font-mono text-xs">
                          MTU {vlan.mtu}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VlanTopologyMobile = memo(VlanTopologyMobileComponent);

VlanTopologyMobile.displayName = 'VlanTopologyMobile';
