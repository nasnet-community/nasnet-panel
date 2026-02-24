import { memo, useMemo } from 'react';
import {
  Badge,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';
import { Network } from 'lucide-react';
import type { BridgePort } from '@nasnet/api-client/generated';

export interface StpPortTableProps {
  ports: BridgePort[];
  className?: string;
}

/**
 * STP Port Table - Shows per-port spanning tree status
 * Displays: Interface name, Role, State, Path cost, Edge flag
 *
 * @description Renders a table showing per-port STP metrics including role, state,
 * path cost, and edge port status. Technical values (path cost) use monospace font.
 */
function StpPortTableComponent({ ports, className }: StpPortTableProps) {
  // Determine STP role badge variant
  const getRoleBadgeVariant = (role: string): 'success' | 'info' | 'warning' | 'secondary' => {
    switch (role.toLowerCase()) {
      case 'root':
        return 'success';
      case 'designated':
        return 'info';
      case 'alternate':
      case 'backup':
        return 'warning';
      case 'disabled':
      default:
        return 'secondary';
    }
  };

  // Determine STP state badge variant
  const getStateBadgeVariant = (state: string): 'success' | 'warning' | 'secondary' => {
    switch (state.toLowerCase()) {
      case 'forwarding':
        return 'success';
      case 'blocking':
      case 'listening':
      case 'learning':
        return 'warning';
      case 'disabled':
      default:
        return 'secondary';
    }
  };

  if (ports.length === 0) {
    return (
      <div className="rounded-[var(--semantic-radius-card)] border p-component-lg text-center">
        <Icon icon={Network} className="mx-auto h-8 w-8 mb-component-md text-muted-foreground opacity-50" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No ports configured</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[var(--semantic-radius-card)] border ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Interface</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Path Cost</TableHead>
            <TableHead>Edge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell className="font-medium font-mono">{port.interface.name}</TableCell>
              <TableCell>
                {port.role ? (
                  <Badge variant={getRoleBadgeVariant(port.role)}>
                    {port.role}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {port.state ? (
                  <Badge variant={getStateBadgeVariant(port.state)}>
                    {port.state}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {port.pathCost ? (
                  <>{port.pathCost}</>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {port.edge ? (
                  <Badge variant="success" className="text-xs">
                    Yes
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">No</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

StpPortTableComponent.displayName = 'StpPortTable';

export const StpPortTable = memo(StpPortTableComponent);
