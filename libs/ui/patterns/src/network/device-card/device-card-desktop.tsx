/**
 * Device Card Desktop Presenter
 *
 * Desktop-optimized presenter for device cards.
 * Features hover states, dropdown menu for actions, and inline editing.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import * as React from 'react';
import { useState, useCallback } from 'react';

import {
  Edit,
  Network,
  Ban,
  MoreVertical,
  Settings,
  History,
} from 'lucide-react';

import {
  Button,
  Input,
  Card,
  cn,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives';

import {
  statusDotVariants,
  statusBadgeVariants,
  connectionBadgeVariants,
} from './device-card-base';
import { ConfidenceIndicator } from '../../confidence-indicator';
import { SafetyConfirmation } from '../../feedback/safety-confirmation';

import type { DeviceCardPresenterProps } from './device-card.types';

/**
 * Device Card Desktop Presenter
 *
 * Desktop-specific features:
 * - Hover state reveals quick action buttons
 * - Dropdown menu for full actions
 * - Inline edit for device name
 * - Dialog for static IP assignment
 * - Safety confirmation for block action
 *
 * @example
 * ```tsx
 * <DeviceCardDesktop
 *   state={hookState}
 *   device={device}
 *   onRename={(name) => updateName(name)}
 *   showActions
 * />
 * ```
 */
export function DeviceCardDesktop({
  state,
  device,
  compact = false,
  showActions = true,
  className,
  id,
  isSelected = false,
  onClick,
  onRename,
  onAssignStaticIp,
}: DeviceCardPresenterProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(state.displayName);
  const [showStaticIpDialog, setShowStaticIpDialog] = useState(false);
  const [staticIpValue, setStaticIpValue] = useState(device.staticIp || '');
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);

  const {
    displayName,
    deviceIcon: Icon,
    statusColor,
    isOnline,
    vendorName,
    deviceTypeConfidence,
    showConfidenceIndicator,
    connectionIcon: ConnectionIcon,
    ariaLabel,
    formattedMac,
    connectionText,
    handleConfigure,
    handleBlock,
    handleRename,
    handleAssignStaticIp,
  } = state;

  // Handle rename submission
  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && renameValue !== state.displayName) {
      handleRename(renameValue.trim());
      onRename?.(renameValue.trim());
    }
    setIsRenaming(false);
  }, [renameValue, state.displayName, handleRename, onRename]);

  // Handle rename key events
  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRenameSubmit();
      } else if (e.key === 'Escape') {
        setRenameValue(state.displayName);
        setIsRenaming(false);
      }
    },
    [handleRenameSubmit, state.displayName]
  );

  // Handle static IP submission
  const handleStaticIpSubmit = useCallback(() => {
    if (staticIpValue.trim()) {
      handleAssignStaticIp(staticIpValue.trim());
      onAssignStaticIp?.(staticIpValue.trim());
    }
    setShowStaticIpDialog(false);
  }, [staticIpValue, handleAssignStaticIp, onAssignStaticIp]);


  // Handle card click
  const handleCardClick = useCallback(() => {
    if (onClick && !isRenaming) {
      onClick();
    }
  }, [onClick, isRenaming]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!isRenaming) {
          e.preventDefault();
          onClick?.();
        }
      }
    },
    [onClick, isRenaming]
  );

  return (
    <>
      <Card
        id={id}
        className={cn(
          'group relative p-4 transition-all duration-200',
          onClick && !isRenaming && 'cursor-pointer hover:shadow-md hover:border-primary/30',
          isSelected && 'border-primary shadow-md ring-2 ring-primary/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
        role="article"
        aria-label={ariaLabel}
        tabIndex={onClick ? 0 : undefined}
        onClick={handleCardClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
      >
        <div className="flex items-start gap-4">
          {/* Device icon container */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50">
            <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row: Name + Status */}
            <div className="flex items-center justify-between gap-2">
              {isRenaming ? (
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Device name"
                />
              ) : (
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {displayName}
                </h3>
              )}
              <span
                className={cn(statusBadgeVariants({ status: statusColor }))}
                role="status"
                aria-live="polite"
              >
                <span
                  className={cn(statusDotVariants({ status: statusColor }))}
                  aria-hidden="true"
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Secondary info row: Vendor + IP */}
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {vendorName && <span className="truncate">{vendorName}</span>}
              {vendorName && device.ip && <span aria-hidden="true">•</span>}
              {device.ip && <span className="font-mono">{device.ip}</span>}
            </div>

            {/* Tertiary row: MAC + Connection + Confidence */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* MAC address */}
              <span className="font-mono text-xs text-muted-foreground">
                {formattedMac}
              </span>

              {/* Connection type */}
              <span
                className={cn(
                  connectionBadgeVariants({
                    type: device.connectionType,
                  })
                )}
              >
                <ConnectionIcon className="h-3 w-3" aria-hidden="true" />
                {connectionText}
              </span>

              {/* Confidence indicator */}
              {showConfidenceIndicator && deviceTypeConfidence !== undefined && (
                <ConfidenceIndicator
                  confidence={deviceTypeConfidence}
                  method="Auto-detected via MAC vendor lookup"
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Action buttons - visible on hover */}
          {showActions && (
            <div
              className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick edit button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsRenaming(true)}
                aria-label="Rename device"
              >
                <Edit className="h-4 w-4" />
              </Button>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStaticIpDialog(true)}>
                    <Network className="mr-2 h-4 w-4" />
                    Assign Static IP
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleConfigure}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Routing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleConfigure}>
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowBlockConfirmation(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block Device
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </Card>

      {/* Static IP Assignment Dialog */}
      <Dialog open={showStaticIpDialog} onOpenChange={setShowStaticIpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Static IP</DialogTitle>
            <DialogDescription>
              Assign a static IP address to {displayName}. This will configure
              the DHCP server to always assign this IP to this device.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="192.168.1.100"
              value={staticIpValue}
              onChange={(e) => setStaticIpValue(e.target.value)}
              className="font-mono"
              aria-label="Static IP address"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStaticIpDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStaticIpSubmit}>Assign IP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Device Safety Confirmation */}
      <SafetyConfirmation
        open={showBlockConfirmation}
        onOpenChange={setShowBlockConfirmation}
        title={`Block ${displayName}`}
        description="This device will be blocked from network access."
        consequences={[
          'Device will lose network connectivity immediately',
          'Existing connections will be terminated',
          'Device will need to be manually unblocked',
        ]}
        confirmText="BLOCK"
        countdownSeconds={5}
        onConfirm={async () => {
          handleBlock();
          setShowBlockConfirmation(false);
        }}
      />
    </>
  );
}
