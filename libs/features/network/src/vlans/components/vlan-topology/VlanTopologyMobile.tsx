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
          <div className="text-muted-foreground animate-pulse">Loading VLAN topology...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <p className="text-error text-center">Failed to load VLAN topology: {error.message}</p>
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
            className="mb-component-md text-muted-foreground mx-auto h-12 w-12"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">No VLANs configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-component-md pb-20', className)}>
      {/* Statistics Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="gap-component-sm flex items-center">
            <Icon
              icon={Network}
              className="h-5 w-5"
              aria-hidden="true"
            />
            VLAN Topology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-component-sm grid grid-cols-2">
            <div className="border-border p-component-sm space-y-component-xs rounded-[var(--semantic-radius-card)] border">
              <p className="text-muted-foreground text-sm">Total VLANs</p>
              <p className="text-2xl font-bold">{stats.totalVlans}</p>
            </div>
            <div className="border-border p-component-sm space-y-component-xs rounded-[var(--semantic-radius-card)] border">
              <p className="text-muted-foreground text-sm">Running</p>
              <p className="text-success text-2xl font-bold">{stats.runningVlans}</p>
            </div>
            <div className="border-border p-component-sm space-y-component-xs rounded-[var(--semantic-radius-card)] border">
              <p className="text-muted-foreground text-sm">Disabled</p>
              <p className="text-muted-foreground text-2xl font-bold">{stats.disabledVlans}</p>
            </div>
            <div className="border-border p-component-sm space-y-component-xs rounded-[var(--semantic-radius-card)] border">
              <p className="text-muted-foreground text-sm">Interfaces</p>
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
              <CardHeader className="pb-component-sm">
                <div className="gap-component-sm flex items-center">
                  {isExpanded ?
                    <Icon
                      icon={ChevronDown}
                      className="text-muted-foreground h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  : <Icon
                      icon={ChevronRight}
                      className="text-muted-foreground h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  }

                  <div className="gap-component-sm flex flex-1 items-start justify-between">
                    <div className="gap-component-xs flex items-center">
                      <Icon
                        icon={Network}
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="text-left">
                        <CardTitle className="font-mono text-base">{iface.name}</CardTitle>
                        <p className="text-muted-foreground text-sm capitalize">{iface.type}</p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="shrink-0"
                    >
                      {iface.vlans.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </button>

            {/* VLANs List */}
            {isExpanded && iface.vlans.length > 0 && (
              <CardContent className="space-y-component-sm pt-0">
                {iface.vlans.map((vlan) => (
                  <button
                    key={vlan.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVlanSelect(vlan.id);
                    }}
                    className="p-component-sm border-border hover:border-primary/50 focus-visible:ring-ring w-full rounded-[var(--semantic-radius-card)] border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    aria-label={`Select VLAN ${vlan.vlanId}: ${vlan.name}`}
                  >
                    <div className="space-y-component-sm">
                      <div className="gap-component-xs flex items-start justify-between">
                        <div className="gap-component-xs flex items-center">
                          <Badge
                            variant="outline"
                            className="min-w-[50px] shrink-0 justify-center font-mono"
                          >
                            {vlan.vlanId}
                          </Badge>
                          <p className="font-medium">{vlan.name}</p>
                        </div>

                        {vlan.isDisabled ?
                          <Badge
                            variant="secondary"
                            className="shrink-0"
                          >
                            Disabled
                          </Badge>
                        : vlan.isRunning ?
                          <Badge
                            variant="success"
                            className="shrink-0"
                          >
                            Running
                          </Badge>
                        : <Badge
                            variant="warning"
                            className="shrink-0"
                          >
                            Down
                          </Badge>
                        }
                      </div>

                      {vlan.comment && (
                        <p className="text-muted-foreground text-sm">{vlan.comment}</p>
                      )}

                      {vlan.mtu && (
                        <Badge
                          variant="outline"
                          className="category-networking font-mono text-xs"
                        >
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
