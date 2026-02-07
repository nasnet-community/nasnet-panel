/**
 * VLAN Topology Desktop Presenter
 *
 * Hierarchical visualization of VLAN topology with parent interfaces.
 */

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from '@nasnet/ui/primitives';
import { Network, ChevronRight, ChevronDown } from 'lucide-react';
import type { UseVlanTopologyReturn } from '../../hooks/use-vlan-topology';

export interface VlanTopologyDesktopProps extends UseVlanTopologyReturn {
  routerId: string;
  onVlanSelect?: (vlanId: string) => void;
}

export function VlanTopologyDesktop({
  topology,
  stats,
  loading,
  error,
  onVlanSelect,
}: VlanTopologyDesktopProps) {
  const [expandedInterfaces, setExpandedInterfaces] = useState<Set<string>>(
    new Set(topology.map((iface) => iface.id))
  );

  const toggleInterface = (interfaceId: string) => {
    setExpandedInterfaces((prev) => {
      const next = new Set(prev);
      if (next.has(interfaceId)) {
        next.delete(interfaceId);
      } else {
        next.add(interfaceId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedInterfaces(new Set(topology.map((iface) => iface.id)));
  };

  const collapseAll = () => {
    setExpandedInterfaces(new Set());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading topology...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (topology.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No VLANs configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              VLAN Topology
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total VLANs</p>
              <p className="text-2xl font-bold">{stats.totalVlans}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold text-success">
                {stats.runningVlans}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Disabled</p>
              <p className="text-2xl font-bold text-muted-foreground">
                {stats.disabledVlans}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Parent Interfaces</p>
              <p className="text-2xl font-bold">{stats.parentInterfaces}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topology Tree */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            {topology.map((iface) => {
              const isExpanded = expandedInterfaces.has(iface.id);

              return (
                <div key={iface.id} className="border rounded-lg">
                  {/* Parent Interface Header */}
                  <button
                    onClick={() => toggleInterface(iface.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}

                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Network className="h-5 w-5" />
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
                    <div className="border-t bg-muted/20">
                      <div className="p-4 pl-16 space-y-2">
                        {iface.vlans.map((vlan) => (
                          <button
                            key={vlan.id}
                            onClick={() => onVlanSelect?.(vlan.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background border hover:border-primary/50 transition-all text-left"
                          >
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center gap-3">
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

                              <div className="flex items-center gap-2">
                                {vlan.mtu && (
                                  <Badge variant="outline" className="font-mono">
                                    MTU {vlan.mtu}
                                  </Badge>
                                )}
                                {vlan.disabled ? (
                                  <Badge variant="muted">Disabled</Badge>
                                ) : vlan.running ? (
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
