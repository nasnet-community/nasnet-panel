/**
 * VPN Server Card Component
 * Displays a VPN server with status, port, connections, and actions
 * Supports all VPN protocols
 */

import * as React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Button,
  Switch,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@nasnet/ui/primitives';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  Activity,
  Settings,
} from 'lucide-react';
import { StatusIndicator } from '../status-indicator';
import { ProtocolIconBadge, getProtocolLabel } from '../protocol-icon';
import { formatBytes } from '@nasnet/core/utils';
import type { VPNProtocol } from '@nasnet/core/types';

export interface VPNServerCardProps {
  /** Server ID */
  id: string;
  /** Server name */
  name: string;
  /** VPN protocol */
  protocol: VPNProtocol;
  /** Server enabled/disabled */
  disabled: boolean;
  /** Server running state */
  running: boolean;
  /** Listening port */
  port?: number;
  /** Connected clients count */
  connectedClients?: number;
  /** Total bytes received */
  rx?: number;
  /** Total bytes transmitted */
  tx?: number;
  /** Optional comment */
  comment?: string;
  /** Toggle enabled handler */
  onToggle?: (id: string, enabled: boolean) => void;
  /** Edit handler */
  onEdit?: (id: string) => void;
  /** Delete handler */
  onDelete?: (id: string) => void;
  /** View details handler */
  onViewDetails?: (id: string) => void;
  /** Loading state for toggle */
  isToggling?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * VPNServerCard Component
 */
export function VPNServerCard({
  id,
  name,
  protocol,
  disabled,
  running,
  port,
  connectedClients = 0,
  rx,
  tx,
  comment,
  onToggle,
  onEdit,
  onDelete,
  onViewDetails,
  isToggling = false,
  className = '',
}: VPNServerCardProps) {
  const status = disabled ? 'offline' : running ? 'online' : 'warning';
  const statusLabel = disabled ? 'Disabled' : running ? 'Running' : 'Stopped';

  const handleToggle = (checked: boolean) => {
    onToggle?.(id, checked);
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProtocolIconBadge protocol={protocol} variant="md" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusIndicator status={status} label={statusLabel} />
                <Badge variant="secondary" className="text-xs uppercase">
                  {getProtocolLabel(protocol)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Switch */}
            {onToggle && (
              <Switch
                checked={!disabled}
                onCheckedChange={handleToggle}
                disabled={isToggling}
                aria-label={disabled ? 'Enable server' : 'Disable server'}
              />
            )}
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(id)}>
                    <Settings className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(onViewDetails || onEdit) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(id)}
                    className="text-error focus:text-error"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Server Info */}
        <div className="space-y-3">
          {/* Port and Connections */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            {port && (
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Port</span>
                <span className="text-sm font-medium text-foreground">{port}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {connectedClients}
              </span>
              <span className="text-sm text-muted-foreground">
                {connectedClients === 1 ? 'client' : 'clients'}
              </span>
            </div>
          </div>

          {/* Traffic Stats */}
          {(rx !== undefined || tx !== undefined) && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {rx !== undefined && (
                  <div>
                    <span className="text-muted-foreground">↓ </span>
                    <span className="font-mono font-medium">{formatBytes(rx)}</span>
                  </div>
                )}
                {tx !== undefined && (
                  <div>
                    <span className="text-muted-foreground">↑ </span>
                    <span className="font-mono font-medium">{formatBytes(tx)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment */}
          {comment && (
            <p className="text-xs text-muted-foreground italic truncate">
              {comment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

