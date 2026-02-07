/**
 * VLAN Topology Mobile Presenter
 *
 * Card-based vertical layout for VLAN topology visualization.
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

export interface VlanTopologyMobileProps extends UseVlanTopologyReturn {
  routerId: string;
  onVlanSelect?: (vlanId: string) => void;
}

export function VlanTopologyMobile({
  topology,
  stats,
  loading,
  error,
  onVlanSelect,
}: VlanTopologyMobileProps) {
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
    <div className="space-y-4 pb-20">
      {/* Statistics Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
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
              onClick={() => toggleInterface(iface.id)}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}

                  <div className="flex-1 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Network className="h-5 w-5 shrink-0" />
                      <div className="text-left">
                        <CardTitle className="text-base">{iface.name}</CardTitle>
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
                      onVlanSelect?.(vlan.id);
                    }}
                    className="w-full p-3 rounded-lg border hover:border-primary/50 transition-all text-left"
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

                        {vlan.disabled ? (
                          <Badge variant="muted" className="shrink-0">
                            Disabled
                          </Badge>
                        ) : vlan.running ? (
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
