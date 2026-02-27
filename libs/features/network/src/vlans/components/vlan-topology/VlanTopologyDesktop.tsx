/**
 * VLAN Topology Desktop Presenter
 *
 * Hierarchical visualization of VLAN topology with parent interfaces.
 * Desktop-optimized with dense information layout and tree-like expansion.
 */

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@nasnet/ui/primitives';
import { Network, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { UseVlanTopologyReturn } from '../../hooks/use-vlan-topology';

/**
 * VlanTopologyDesktop Props
 * @interface VlanTopologyDesktopProps
 */
export interface VlanTopologyDesktopProps extends UseVlanTopologyReturn {
  routerId: string;
  onVlanSelect?: (vlanId: string) => void;
}

function VlanTopologyDesktopContent({
  topology,
  stats,
  isLoading,
  error,
  onVlanSelect,
}: VlanTopologyDesktopProps) {
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

  const handleExpandAll = useCallback(() => {
    setExpandedInterfaces(new Set(topology.map((iface) => iface.id)));
  }, [topology]);

  const handleCollapseAll = useCallback(() => {
    setExpandedInterfaces(new Set());
  }, []);

  const handleVlanSelect = useCallback(
    (vlanId: string) => {
      onVlanSelect?.(vlanId);
    },
    [onVlanSelect]
  );

  if (isLoading) {
    return (
      <Card>
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
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-error" role="alert">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topology.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="h-12 w-12 mx-auto mb-component-md text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No VLANs configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-component-md">
      {/* Statistics Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-component-sm">
              <Network className="h-5 w-5" aria-hidden="true" />
              VLAN Topology
            </CardTitle>
            <div className="flex items-center gap-component-sm">
              <Button variant="outline" size="sm" onClick={handleExpandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-component-md">
            <div className="space-y-component-xs">
              <p className="text-sm text-muted-foreground">Total VLANs</p>
              <p className="text-2xl font-bold font-mono">{stats.totalVlans}</p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold font-mono text-success">
                {stats.runningVlans}
              </p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold font-mono text-muted-foreground">
                {stats.disabledVlans}
              </p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-sm text-muted-foreground">Parent Interfaces</p>
              <p className="text-2xl font-bold font-mono">{stats.parentInterfaces}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topology Tree */}
      <Card>
        <CardContent className="p-component-lg">
          <div className="space-y-component-sm">
            {topology.map((iface) => {
              const isExpanded = expandedInterfaces.has(iface.id);

              return (
                <div key={iface.id} className="border border-border rounded-[var(--semantic-radius-card)]">
                  {/* Parent Interface Header */}
                  <button
                    onClick={() => handleToggleInterface(iface.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`vlan-list-${iface.id}`}
                    className="w-full flex items-center gap-component-sm p-component-md hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    )}

                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-component-sm">
                        <Network className="h-5 w-5" aria-hidden="true" />
                        <div className="text-left">
                          <p className="font-medium">{iface.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {iface.type} interface
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline">
                        {iface.vlans.length} VLAN{iface.vlans.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </button>

                  {/* VLANs List */}
                  {isExpanded && iface.vlans.length > 0 && (
                    <div id={`vlan-list-${iface.id}`} className="border-t border-border bg-muted/20">
                      <div className="p-component-md pl-16 space-y-component-sm">
                        {iface.vlans.map((vlan) => (
                          <button
                            key={vlan.id}
                            onClick={() => handleVlanSelect(vlan.id)}
                            className="w-full flex items-center gap-component-sm p-component-sm rounded-[var(--semantic-radius-card)] hover:bg-card border border-border hover:border-primary/50 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center gap-component-sm">
                                <Badge
                                  variant="outline"
                                  className="font-mono min-w-[60px] justify-center"
                                >
                                  {vlan.vlanId}
                                </Badge>
                                <div>
                                  <p className="font-medium">{vlan.name}</p>
                                  {vlan.comment && (
                                    <p className="text-sm text-muted-foreground">
                                      {vlan.comment}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-component-xs">
                                {vlan.mtu && (
                                  <Badge variant="outline" className="font-mono">
                                    MTU {vlan.mtu}
                                  </Badge>
                                )}
                                {vlan.isDisabled ? (
                                  <Badge variant="secondary">Disabled</Badge>
                                ) : vlan.isRunning ? (
                                  <Badge variant="success">Running</Badge>
                                ) : (
                                  <Badge variant="warning">Not Running</Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const VlanTopologyDesktop = memo(VlanTopologyDesktopContent);
VlanTopologyDesktop.displayName = 'VlanTopologyDesktop';
