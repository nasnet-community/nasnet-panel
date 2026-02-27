/**
 * VPN Client Card Component
 *
 * Displays a VPN client with status, server, connection stats, and actions.
 * Supports all VPN protocols.
 *
 * @example
 * ```tsx
 * <VPNClientCard
 *   id="1"
 *   name="Office VPN"
 *   protocol="wireguard"
 *   isDisabled={false}
 *   isRunning={true}
 *   connectTo="vpn.example.com"
 * />
 * ```
 */

import { memo, useCallback } from 'react';
import { MoreVertical, Power, Pencil, Trash2, Globe, Clock, ArrowDownUp } from 'lucide-react';

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
  Icon,
  cn,
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
  isDisabled: boolean;
  /** Client running/connected state */
  isRunning: boolean;

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
function VPNClientCardComponent({
  id,
  name,
  protocol,
  isDisabled,
  isRunning,
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
  const status =
    isDisabled ? 'offline'
    : isRunning ? 'online'
    : 'warning';
  const statusLabel =
    isDisabled ? 'Disabled'
    : isRunning ? 'Connected'
    : 'Disconnected';

  const handleToggle = useCallback(
    (checked: boolean) => {
      onToggle?.(id, checked);
    },
    [id, onToggle]
  );

  return (
    <Card
      className={cn(
        'bg-card border-l-category-vpn border-border rounded-[var(--semantic-radius-card)] border border-l-4 shadow-[var(--semantic-shadow-card)] transition-shadow duration-200 hover:shadow-lg',
        className
      )}
      aria-label={`${name} VPN client - ${statusLabel}`}
    >
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProtocolIconBadge
              protocol={protocol}
              variant="md"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-foreground truncate text-lg font-semibold">
                {name}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <StatusIndicator
                  status={status}
                  label={statusLabel}
                />
                <Badge
                  variant="secondary"
                  className="font-mono text-xs uppercase"
                >
                  {getProtocolLabel(protocol)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Toggle Switch */}
            {onToggle && (
              <Switch
                checked={!isDisabled}
                onCheckedChange={handleToggle}
                disabled={isToggling}
                aria-label={isDisabled ? 'Enable client' : 'Disable client'}
              />
            )}

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 min-h-[44px] w-8 min-w-[44px]"
                >
                  <Icon
                    icon={MoreVertical}
                    className="h-4 w-4"
                  />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onConnect && (
                  <DropdownMenuItem onClick={() => onConnect(id)}>
                    <Icon
                      icon={Power}
                      className="mr-2 h-4 w-4"
                    />
                    {isRunning ? 'Disconnect' : 'Connect'}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Icon
                      icon={Pencil}
                      className="mr-2 h-4 w-4"
                    />
                    Edit
                  </DropdownMenuItem>
                )}
                {(onConnect || onEdit) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-error focus:text-error"
                  >
                    <Icon
                      icon={Trash2}
                      className="mr-2 h-4 w-4"
                    />
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
          <div className="border-border flex items-center gap-2 border-b py-2">
            <Icon
              icon={Globe}
              className="text-muted-foreground h-4 w-4 flex-shrink-0"
            />
            <span className="text-muted-foreground text-sm">Server</span>
            <span className="text-muted-foreground flex-1 truncate text-right font-mono text-sm">
              {connectTo}
              {port ? `:${port}` : ''}
            </span>
          </div>

          {/* User */}
          {user && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">User</span>
              <span className="text-muted-foreground font-mono text-sm">{user}</span>
            </div>
          )}

          {/* Connection Info (when connected) */}
          {isRunning && (
            <>
              {/* Uptime */}
              {uptime && (
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon={Clock}
                    className="text-muted-foreground h-4 w-4 flex-shrink-0"
                  />
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-muted-foreground ml-auto font-mono text-sm">{uptime}</span>
                </div>
              )}

              {/* IP Addresses */}
              {(localAddress || remoteAddress) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {localAddress && (
                    <div>
                      <span className="text-muted-foreground block text-xs">Local IP</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {localAddress}
                      </span>
                    </div>
                  )}
                  {remoteAddress && (
                    <div>
                      <span className="text-muted-foreground block text-xs">Remote IP</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {remoteAddress}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Traffic Stats */}
              {(rx !== undefined || tx !== undefined) && (
                <div className="border-border flex items-center gap-2 border-t pt-2">
                  <Icon
                    icon={ArrowDownUp}
                    className="text-muted-foreground h-4 w-4 flex-shrink-0"
                  />
                  <div className="flex items-center gap-4 text-xs">
                    {rx !== undefined && (
                      <div>
                        <span className="text-muted-foreground">↓ </span>
                        <span className="text-muted-foreground font-mono">{formatBytes(rx)}</span>
                      </div>
                    )}
                    {tx !== undefined && (
                      <div>
                        <span className="text-muted-foreground">↑ </span>
                        <span className="text-muted-foreground font-mono">{formatBytes(tx)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Comment */}
          {comment && (
            <p className="text-muted-foreground truncate pt-2 text-xs italic">{comment}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNClientCard = memo(VPNClientCardComponent);
VPNClientCard.displayName = 'VPNClientCard';
