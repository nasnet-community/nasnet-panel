/**
 * VPN Server Card Component
 *
 * Displays a VPN server with status, port, connections, and actions.
 * Supports all VPN protocols.
 *
 * @example
 * ```tsx
 * <VPNServerCard
 *   id="1"
 *   name="WireGuard Server"
 *   protocol="wireguard"
 *   isDisabled={false}
 *   isRunning={true}
 * />
 * ```
 */

import { memo, forwardRef, useCallback } from 'react';

import { MoreVertical, Edit, Trash2, Users, Activity, Settings, ArrowDownUp } from 'lucide-react';

import type { VPNProtocol } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { cn } from '@nasnet/ui/utils';
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
} from '@nasnet/ui/primitives';

import { ProtocolIconBadge, getProtocolLabel } from '../protocol-icon';
import { StatusIndicator } from '../status-indicator';

export interface VPNServerCardProps {
  /** Server ID */
  id: string;
  /** Server name */
  name: string;
  /** VPN protocol */
  protocol: VPNProtocol;
  /** Server enabled/disabled */
  isDisabled: boolean;
  /** Server running state */
  isRunning: boolean;
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
function VPNServerCardComponent({
  id,
  name,
  protocol,
  isDisabled,
  isRunning,
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
  const status =
    isDisabled ? 'offline'
    : isRunning ? 'online'
    : 'warning';
  const statusLabel =
    isDisabled ? 'Disabled'
    : isRunning ? 'Running'
    : 'Stopped';

  const handleToggle = useCallback(
    (checked: boolean) => {
      onToggle?.(id, checked);
    },
    [id, onToggle]
  );

  const handleEdit = useCallback(() => {
    onEdit?.(id);
  }, [id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(id);
  }, [id, onDelete]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(id);
  }, [id, onViewDetails]);

  return (
    <Card
      className={cn(
        'bg-card border-l-category-vpn border-border rounded-[var(--semantic-radius-card)] border border-l-4 shadow-[var(--semantic-shadow-card)] transition-shadow duration-200 hover:shadow-lg',
        className
      )}
      aria-label={`${name} VPN server - ${statusLabel}`}
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
                aria-label={isDisabled ? 'Enable server' : 'Disable server'}
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
                {onViewDetails && (
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <Icon
                      icon={Settings}
                      className="mr-2 h-4 w-4"
                    />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Icon
                      icon={Edit}
                      className="mr-2 h-4 w-4"
                    />
                    Edit
                  </DropdownMenuItem>
                )}
                {(onViewDetails || onEdit) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
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
        {/* Server Info */}
        <div className="space-y-3">
          {/* Port and Connections */}
          <div className="border-border flex items-center justify-between border-b py-2">
            {port && (
              <div className="flex items-center gap-2">
                <Icon
                  icon={Activity}
                  className="text-muted-foreground h-4 w-4 flex-shrink-0"
                />
                <span className="text-muted-foreground text-sm">Port</span>
                <span className="text-muted-foreground font-mono text-sm">{port}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Icon
                icon={Users}
                className="text-muted-foreground h-4 w-4 flex-shrink-0"
              />
              <span className="text-muted-foreground font-mono text-sm">{connectedClients}</span>
              <span className="text-muted-foreground text-sm">
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
                    <span className="text-muted-foreground font-mono text-xs">
                      {formatBytes(rx)}
                    </span>
                  </div>
                )}
                {tx !== undefined && (
                  <div>
                    <span className="text-muted-foreground">↑ </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {formatBytes(tx)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment */}
          {comment && <p className="text-muted-foreground truncate text-xs italic">{comment}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export const VPNServerCard = memo(
  forwardRef<HTMLDivElement, VPNServerCardProps>((props, ref) => (
    <VPNServerCardComponent {...props} />
  ))
);

VPNServerCard.displayName = 'VPNServerCard';
