/**
 * VLAN Topology Desktop Presenter
 *
 * Hierarchical visualization of VLAN topology with parent interfaces.
 * Desktop-optimized with dense information layout and tree-like expansion.
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@nasnet/ui/primitives';
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
          <div className="text-muted-foreground animate-pulse">Loading VLAN topology...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p
            className="text-error text-center"
            role="alert"
          >
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
          <Network
            className="mb-component-md text-muted-foreground mx-auto h-12 w-12"
            aria-hidden="true"
          />
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
            <CardTitle className="gap-component-sm flex items-center">
              <Network
                className="h-5 w-5"
                aria-hidden="true"
              />
              VLAN Topology
            </CardTitle>
            <div className="gap-component-sm flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="gap-component-md grid grid-cols-4">
            <div className="space-y-component-xs">
              <p className="text-muted-foreground text-sm">Total VLANs</p>
              <p className="font-mono text-2xl font-bold">{stats.totalVlans}</p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-muted-foreground text-sm">Running</p>
              <p className="text-success font-mono text-2xl font-bold">{stats.runningVlans}</p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-muted-foreground text-sm">Disabled</p>
              <p className="text-muted-foreground font-mono text-2xl font-bold">
                {stats.disabledVlans}
              </p>
            </div>
            <div className="space-y-component-xs">
              <p className="text-muted-foreground text-sm">Parent Interfaces</p>
              <p className="font-mono text-2xl font-bold">{stats.parentInterfaces}</p>
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
                <div
                  key={iface.id}
                  className="border-border rounded-[var(--semantic-radius-card)] border"
                >
                  {/* Parent Interface Header */}
                  <button
                    onClick={() => handleToggleInterface(iface.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`vlan-list-${iface.id}`}
                    className="gap-component-sm p-component-md hover:bg-muted/50 focus-visible:ring-ring flex w-full items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  >
                    {isExpanded ?
                      <ChevronDown
                        className="text-muted-foreground h-5 w-5"
                        aria-hidden="true"
                      />
                    : <ChevronRight
                        className="text-muted-foreground h-5 w-5"
                        aria-hidden="true"
                      />
                    }

                    <div className="flex flex-1 items-center justify-between">
                      <div className="gap-component-sm flex items-center">
                        <Network
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                        <div className="text-left">
                          <p className="font-medium">{iface.name}</p>
                          <p className="text-muted-foreground text-sm capitalize">
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
                    <div
                      id={`vlan-list-${iface.id}`}
                      className="border-border bg-muted/20 border-t"
                    >
                      <div className="p-component-md space-y-component-sm pl-16">
                        {iface.vlans.map((vlan) => (
                          <button
                            key={vlan.id}
                            onClick={() => handleVlanSelect(vlan.id)}
                            className="gap-component-sm p-component-sm hover:bg-card border-border hover:border-primary/50 focus-visible:ring-ring flex w-full items-center rounded-[var(--semantic-radius-card)] border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          >
                            <div className="flex flex-1 items-center justify-between">
                              <div className="gap-component-sm flex items-center">
                                <Badge
                                  variant="outline"
                                  className="min-w-[60px] justify-center font-mono"
                                >
                                  {vlan.vlanId}
                                </Badge>
                                <div>
                                  <p className="font-medium">{vlan.name}</p>
                                  {vlan.comment && (
                                    <p className="text-muted-foreground text-sm">{vlan.comment}</p>
                                  )}
                                </div>
                              </div>

                              <div className="gap-component-xs flex items-center">
                                {vlan.mtu && (
                                  <Badge
                                    variant="outline"
                                    className="font-mono"
                                  >
                                    MTU {vlan.mtu}
                                  </Badge>
                                )}
                                {vlan.isDisabled ?
                                  <Badge variant="secondary">Disabled</Badge>
                                : vlan.isRunning ?
                                  <Badge variant="success">Running</Badge>
                                : <Badge variant="warning">Not Running</Badge>}
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
