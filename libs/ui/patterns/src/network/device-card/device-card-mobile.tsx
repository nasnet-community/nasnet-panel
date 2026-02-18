/**
 * Device Card Mobile Presenter
 *
 * Mobile-optimized presenter for device cards.
 * Features touch-friendly interactions and bottom sheet for details.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import { useState, useCallback } from 'react';

import {
  Edit,
  Network,
  Ban,
  Settings,
  History,
  ChevronRight,
} from 'lucide-react';

import {
  Button,
  Input,
  Card,
  cn,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Separator,
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
 * Device Card Mobile Presenter
 *
 * Mobile-specific features:
 * - Tap opens bottom sheet with full details
 * - 44px minimum touch targets
 * - Bottom sheet for device actions
 * - Full-width action buttons
 *
 * @example
 * ```tsx
 * <DeviceCardMobile
 *   state={hookState}
 *   device={device}
 *   onRename={(name) => updateName(name)}
 *   showActions
 * />
 * ```
 */
export function DeviceCardMobile({
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
    deviceTypeLabel,
    handleConfigure,
    handleBlock,
    handleRename,
    handleAssignStaticIp,
  } = state;

  // Handle card tap - open sheet
  const handleCardTap = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      setIsSheetOpen(true);
    }
  }, [onClick]);

  // Handle rename submission
  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim() && renameValue !== state.displayName) {
      handleRename(renameValue.trim());
      onRename?.(renameValue.trim());
    }
    setIsRenaming(false);
  }, [renameValue, state.displayName, handleRename, onRename]);

  // Handle static IP submission
  const handleStaticIpSubmit = useCallback(() => {
    if (staticIpValue.trim()) {
      handleAssignStaticIp(staticIpValue.trim());
      onAssignStaticIp?.(staticIpValue.trim());
    }
    setShowStaticIpDialog(false);
  }, [staticIpValue, handleAssignStaticIp, onAssignStaticIp]);

  return (
    <>
      {/* Card - tap to open sheet */}
      <Card
        id={id}
        className={cn(
          'group relative p-4 transition-all duration-200 active:scale-[0.98]',
          isSelected && 'border-primary shadow-md ring-2 ring-primary/20',
          'min-h-[64px]', // 44px + padding for touch target
          className
        )}
        role="article"
        aria-label={ariaLabel}
        tabIndex={0}
        onClick={handleCardTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardTap();
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Device icon container */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/50">
            <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name + Status row */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </h3>
              <span
                className={cn(statusDotVariants({ status: statusColor }))}
                aria-hidden="true"
              />
            </div>

            {/* Info row */}
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {device.ip && <span className="font-mono">{device.ip}</span>}
              {device.ip && <span aria-hidden="true">•</span>}
              <span className={cn(connectionBadgeVariants({ type: device.connectionType }))}>
                <ConnectionIcon className="h-3 w-3" aria-hidden="true" />
                {connectionText}
              </span>
            </div>
          </div>

          {/* Chevron indicator */}
          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </Card>

      {/* Bottom Sheet for device details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="h-6 w-6 text-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit();
                      if (e.key === 'Escape') {
                        setRenameValue(state.displayName);
                        setIsRenaming(false);
                      }
                    }}
                    className="h-8"
                    autoFocus
                    aria-label="Device name"
                  />
                ) : (
                  <SheetTitle className="truncate">{displayName}</SheetTitle>
                )}
                <SheetDescription className="truncate mt-0.5">
                  {vendorName || deviceTypeLabel}
                </SheetDescription>
              </div>
              <span
                className={cn(statusBadgeVariants({ status: statusColor }))}
                role="status"
              >
                <span
                  className={cn(statusDotVariants({ status: statusColor }))}
                  aria-hidden="true"
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </SheetHeader>

          <Separator />

          {/* Device Details */}
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-muted-foreground">IP Address</dt>
                <dd className="font-mono text-sm">{device.ip || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">MAC Address</dt>
                <dd className="font-mono text-sm">{formattedMac}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Connection</dt>
                <dd className="flex items-center gap-1 text-sm">
                  <ConnectionIcon className="h-4 w-4" aria-hidden="true" />
                  {connectionText}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Device Type</dt>
                <dd className="flex items-center gap-2 text-sm">
                  {deviceTypeLabel}
                  {showConfidenceIndicator && deviceTypeConfidence !== undefined && (
                    <ConfidenceIndicator
                      confidence={deviceTypeConfidence}
                      method="Auto-detected via MAC vendor lookup"
                      size="sm"
                    />
                  )}
                </dd>
              </div>
              {vendorName && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Vendor</dt>
                  <dd className="text-sm">{vendorName}</dd>
                </div>
              )}
              {device.signalStrength !== undefined && (
                <div>
                  <dt className="text-xs text-muted-foreground">Signal</dt>
                  <dd className="text-sm">{device.signalStrength} dBm</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">First Seen</dt>
                <dd className="text-sm">
                  {new Date(device.firstSeen).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last Seen</dt>
                <dd className="text-sm">
                  {new Date(device.lastSeen).toLocaleString()}
                </dd>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          {showActions && (
            <div className="py-4 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Actions
              </h4>
              <Button
                variant="outline"
                className="w-full justify-start h-12 min-h-[44px]"
                onClick={() => {
                  setIsRenaming(true);
                }}
              >
                <Edit className="mr-3 h-4 w-4" />
                Rename Device
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 min-h-[44px]"
                onClick={() => setShowStaticIpDialog(true)}
              >
                <Network className="mr-3 h-4 w-4" />
                Assign Static IP
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 min-h-[44px]"
                onClick={() => {
                  handleConfigure();
                  setIsSheetOpen(false);
                }}
              >
                <Settings className="mr-3 h-4 w-4" />
                Configure Routing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 min-h-[44px]"
                onClick={() => {
                  handleConfigure();
                  setIsSheetOpen(false);
                }}
              >
                <History className="mr-3 h-4 w-4" />
                View Connection History
              </Button>
              <Separator className="my-3" />
              <Button
                variant="outline"
                className="w-full justify-start h-12 min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowBlockConfirmation(true)}
              >
                <Ban className="mr-3 h-4 w-4" />
                Block Device
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Static IP Assignment Dialog */}
      <Dialog open={showStaticIpDialog} onOpenChange={setShowStaticIpDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Static IP</DialogTitle>
            <DialogDescription>
              Assign a static IP address to {displayName}.
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
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowStaticIpDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStaticIpSubmit}
              className="w-full sm:w-auto"
            >
              Assign IP
            </Button>
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
          setIsSheetOpen(false);
        }}
      />
    </>
  );
}
