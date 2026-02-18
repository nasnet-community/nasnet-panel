import { Badge } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { X, Settings } from 'lucide-react';
import type { BridgePort } from '@nasnet/api-client/generated';

export interface PortNodeProps {
  port: BridgePort;
  onRemove: (portId: string) => void;
  onEdit: (portId: string) => void;
  isRemoving?: boolean;
}

/**
 * Port Node Component - Visualizes a bridge port with VLAN and STP info
 * Shows: Interface name, PVID, Tagged VLANs, STP role/state
 */
export function PortNode({ port, onRemove, onEdit, isRemoving = false }: PortNodeProps) {
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

  return (
    <div
      className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
      role="listitem"
      aria-label={`Port ${port.interface.name}`}
    >
      {/* Port Icon/Connector */}
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="6" y="8" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8V6M15 8V6M9 16V18M15 16V18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Port Info */}
      <div className="flex-1 min-w-0">
        {/* Interface Name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{port.interface.name}</span>
          {port.edge && (
            <Badge variant="info" className="text-xs">
              Edge
            </Badge>
          )}
        </div>

        {/* VLAN Info */}
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">PVID: {port.pvid}</span>

          {port.taggedVlans && port.taggedVlans.length > 0 && (
            <>
              <span>•</span>
              <span>Tagged: {port.taggedVlans.join(', ')}</span>
            </>
          )}

          {port.untaggedVlans && port.untaggedVlans.length > 0 && (
            <>
              <span>•</span>
              <span>Untagged: {port.untaggedVlans.join(', ')}</span>
            </>
          )}
        </div>

        {/* STP Info */}
        {port.role && port.state && (
          <div className="flex items-center gap-1 mt-1">
            <Badge variant={getRoleBadgeVariant(port.role)} className="text-xs">
              {port.role}
            </Badge>
            <Badge variant={getStateBadgeVariant(port.state)} className="text-xs">
              {port.state}
            </Badge>
            {port.pathCost && (
              <span className="text-xs text-muted-foreground">Cost: {port.pathCost}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(port.id)}
          aria-label={`Edit ${port.interface.name} settings`}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(port.id)}
          disabled={isRemoving}
          aria-label={`Remove ${port.interface.name} from bridge`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
