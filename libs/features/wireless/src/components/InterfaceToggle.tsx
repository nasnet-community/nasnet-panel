/**
 * InterfaceToggle Component
 * @description Toggle switch for enabling/disabling wireless interfaces with
 * confirmation dialog and optimistic updates. Provides feedback for pending state.
 * Implements FR0-17: Enable/disable wireless interfaces
 */

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Switch, cn } from '@nasnet/ui/primitives';
import { ConfirmationDialog } from '@nasnet/ui/patterns';
import { useToggleInterface } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { WirelessInterface } from '@nasnet/core/types';

export interface InterfaceToggleProps {
  /** Wireless interface to control */
  interface: WirelessInterface;
  /** Optional CSS className */
  className?: string;
  /** Callback when toggle is clicked (before confirmation) */
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Interface Toggle Component
 * - Displays a switch for enabling/disabling wireless interface
 * - Shows confirmation dialog before state change
 * - Handles optimistic updates with error recovery
 * - Provides visual feedback during loading state
 *
 * @example
 * ```tsx
 * <InterfaceToggle
 *   interface={wirelessInterface}
 *   onClick={(e) => e.stopPropagation()}
 * />
 * ```
 */
export const InterfaceToggle = React.memo(function InterfaceToggle({
  interface: iface,
  className,
  onClick,
}: InterfaceToggleProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const toggleMutation = useToggleInterface();
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  /**
   * Handle switch click - show confirmation dialog
   */
  const handleSwitchClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent event bubbling (e.g., when inside a clickable card)
      e.stopPropagation();

      // Call optional onClick handler
      if (onClick) {
        onClick(e);
      }

      // Determine new state and show confirmation
      const newDisabledState = !iface.disabled;
      setPendingState(newDisabledState);
      setShowConfirmation(true);
    },
    [iface.disabled, onClick]
  );

  /**
   * Handle confirmation - execute the toggle mutation
   */
  const handleConfirm = useCallback(() => {
    if (pendingState === null) return;

    toggleMutation.mutate({
      routerIp,
      id: iface.id,
      name: iface.name,
      disabled: pendingState,
    });

    setShowConfirmation(false);
    setPendingState(null);
  }, [pendingState, toggleMutation, routerIp, iface.id, iface.name]);

  /**
   * Handle cancel - close dialog without changes
   */
  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setPendingState(null);
  }, []);

  // Determine dialog content based on pending action
  const dialogTitle = pendingState
    ? `Disable ${iface.name}?`
    : `Enable ${iface.name}?`;

  const dialogDescription = pendingState
    ? `This will disable the wireless interface. ${
        iface.connectedClients > 0
          ? `${iface.connectedClients} connected client(s) will be disconnected.`
          : 'No clients will be affected.'
      }`
    : `This will enable the wireless interface and make it available for connections.`;

  const dialogVariant = pendingState ? 'destructive' : 'constructive';
  const confirmLabel = pendingState ? 'Disable' : 'Enable';

  return (
    <>
      {/* Toggle Switch */}
      <div
        className={cn('flex items-center gap-2', className)}
        onClick={handleSwitchClick}
      >
        <Switch
          checked={!iface.disabled}
          disabled={toggleMutation.isPending}
          aria-label={
            iface.disabled
              ? `Enable ${iface.name}`
              : `Disable ${iface.name}`
          }
          className={cn(
            !iface.disabled &&
              'data-[state=checked]:bg-emerald-600 data-[state=checked]:hover:bg-emerald-700'
          )}
        />
        {toggleMutation.isPending && (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {pendingState ? 'Disabling...' : 'Enabling...'}
          </span>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={confirmLabel}
        variant={dialogVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={toggleMutation.isPending}
      />
    </>
  );
});

InterfaceToggle.displayName = 'InterfaceToggle';
