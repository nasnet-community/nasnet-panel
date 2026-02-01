/**
 * VPN Client Card Component
 * Displays a VPN client with status, server, connection stats, and actions
 * Supports all VPN protocols
 */

import * as React from 'react';

import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Globe,
  Clock,
  ArrowDownUp,
  Power,
} from 'lucide-react';

import type { VPNProtocol } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
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

import { ProtocolIconBadge, getProtocolLabel } from '../protocol-icon';
import { StatusIndicator } from '../status-indicator';


export interface VPNClientCardProps {
  /** Client ID */
  id: string;
  /** Client name */
  name: string;
  /** VPN protocol */
  protocol: VPNProtocol;
  /** Client enabled/disabled */
  disabled: boolean;
  /** Client running/connected state */
  running: boolean;
  /** Remote server address */
  connectTo: string;
  /** Remote port */
  port?: number;
  /** Username */
  user?: string;
  /** Connection uptime */
  uptime?: string;
  /** Total bytes received */
  rx?: number;
  /** Total bytes transmitted */
  tx?: number;
  /** Local IP address */
  localAddress?: string;
  /** Remote IP address */
  remoteAddress?: string;
  /** Optional comment */
  comment?: string;
  /** Toggle enabled handler */
  onToggle?: (id: string, enabled: boolean) => void;
  /** Connect/Disconnect handler */
  onConnect?: (id: string) => void;
  /** Edit handler */
  onEdit?: (id: string) => void;
  /** Delete handler */
  onDelete?: (id: string) => void;
  /** Loading state for toggle */
  isToggling?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * VPNClientCard Component
 */
export function VPNClientCard({
  id,
  name,
  protocol,
  disabled,
  running,
  connectTo,
  port,
  user,
  uptime,
  rx,
  tx,
  localAddress,
  remoteAddress,
  comment,
  onToggle,
  onConnect,
  onEdit,
  onDelete,
  isToggling = false,
  className = '',
}: VPNClientCardProps) {
  const status = disabled ? 'offline' : running ? 'online' : 'warning';
  const statusLabel = disabled ? 'Disabled' : running ? 'Connected' : 'Disconnected';

  const handleToggle = (checked: boolean) => {
    onToggle?.(id, checked);
  };

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md 
        ${running ? 'border-success/30 dark:border-success/20' : ''}
        ${className}
      `}
    >
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
                aria-label={disabled ? 'Enable client' : 'Disable client'}
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
                {onConnect && (
                  <DropdownMenuItem onClick={() => onConnect(id)}>
                    <Power className="mr-2 h-4 w-4" />
                    {running ? 'Disconnect' : 'Connect'}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(onConnect || onEdit) && onDelete && <DropdownMenuSeparator />}
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
        {/* Client Info */}
        <div className="space-y-3">
          {/* Remote Server */}
          <div className="flex items-center gap-2 py-2 border-b border-border">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Server</span>
            <span className="text-sm font-medium text-foreground truncate flex-1 text-right">
              {connectTo}{port ? `:${port}` : ''}
            </span>
          </div>

          {/* User */}
          {user && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">User</span>
              <span className="font-mono font-medium">{user}</span>
            </div>
          )}

          {/* Connection Info (when connected) */}
          {running && (
            <>
              {/* Uptime */}
              {uptime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono font-medium ml-auto">{uptime}</span>
                </div>
              )}

              {/* IP Addresses */}
              {(localAddress || remoteAddress) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {localAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground block">Local IP</span>
                      <span className="font-mono text-xs">{localAddress}</span>
                    </div>
                  )}
                  {remoteAddress && (
                    <div>
                      <span className="text-xs text-muted-foreground block">Remote IP</span>
                      <span className="font-mono text-xs">{remoteAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Traffic Stats */}
              {(rx !== undefined || tx !== undefined) && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-4 text-sm">
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
            </>
          )}

          {/* Comment */}
          {comment && (
            <p className="text-xs text-muted-foreground italic truncate pt-2">
              {comment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

