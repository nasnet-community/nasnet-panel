import { Badge } from '@nasnet/ui/primitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';
import type { BridgePort } from '@nasnet/api-client/generated';

export interface StpPortTableProps {
  ports: BridgePort[];
}

/**
 * STP Port Table - Shows per-port spanning tree status
 * Displays: Interface name, Role, State, Path cost, Edge flag
 */
export function StpPortTable({ ports }: StpPortTableProps) {
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
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">No ports configured</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
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
              <TableCell className="font-medium">{port.interface.name}</TableCell>
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
              <TableCell className="text-right">
                {port.pathCost ? (
                  <code className="text-xs font-mono">{port.pathCost}</code>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {port.edge ? (
                  <Badge variant="info" className="text-xs">
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
