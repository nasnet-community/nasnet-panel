/**
 * WirelessSettingsModal Component
 * Modal dialog for editing comprehensive wireless settings
 * Implements FR0-18: Modal for editing wireless configuration
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@nasnet/ui/primitives';
import { ConfirmationDialog } from '@nasnet/ui/patterns';
import { useUpdateWirelessSettings } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import type { WirelessInterfaceDetail } from '@nasnet/core/types';
import { WirelessSettingsForm } from './WirelessSettingsForm';
import type { WirelessSettingsFormData } from '../validation/wirelessSettings.schema';

export interface WirelessSettingsModalProps {
  /** The wireless interface to edit */
  interface: WirelessInterfaceDetail;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Wireless Settings Modal Component
 * - Dialog with responsive layout (wider for comprehensive form)
 * - Wraps WirelessSettingsForm with all interface values
 * - Handles unsaved changes warning
 * - Integrates with mutation hook for all settings
 * - Scrollable content for mobile devices
 *
 * @description Modal dialog for editing comprehensive wireless settings with unsaved changes detection
 *
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <WirelessSettingsModal
 *   interface={wirelessInterface}
 *   open={showModal}
 *   onOpenChange={setShowModal}
 * />
 * ```
 */
function WirelessSettingsModalComponent({
  interface: iface,
  open,
  onOpenChange,
}: WirelessSettingsModalProps) {
  const [isDirty, setIsDirty] = React.useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = React.useState(false);
  const updateMutation = useUpdateWirelessSettings();
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  /**
   * Handle form submission with all settings
   */
  const handleSubmit = React.useCallback(
    (data: WirelessSettingsFormData) => {
      // Build comprehensive update request
      updateMutation.mutate(
        {
          routerIp,
          interfaceId: iface.id,
          interfaceName: iface.name,
          securityProfileId: iface.securityProfile || 'default',

          // Basic settings - only include if changed
          ssid: data.ssid !== iface.ssid ? data.ssid : undefined,
          password: data.password && data.password.length > 0 ? data.password : undefined,
          hideSsid: data.hideSsid !== iface.hideSsid ? data.hideSsid : undefined,

          // Radio settings - only include if changed
          channel: data.channel !== iface.channel ? data.channel : undefined,
          channelWidth: data.channelWidth !== iface.channelWidth ? data.channelWidth : undefined,
          txPower: data.txPower !== iface.txPower ? data.txPower : undefined,

          // Security settings
          securityMode: data.securityMode,

          // Regional settings - only include if changed
          countryCode: data.countryCode !== iface.countryCode ? data.countryCode : undefined,
        },
        {
          onSuccess: () => {
            // Close modal on success
            setIsDirty(false);
            onOpenChange(false);
          },
        }
      );
    },
    [iface, routerIp, updateMutation, onOpenChange]
  );

  /**
   * Handle cancel - check for unsaved changes
   */
  const handleCancel = React.useCallback(() => {
    if (isDirty) {
      // Show unsaved changes warning
      setShowUnsavedWarning(true);
    } else {
      // No changes, just close
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange]);

  /**
   * Handle discard changes confirmation
   */
  const handleDiscardChanges = React.useCallback(() => {
    setShowUnsavedWarning(false);
    setIsDirty(false);
    onOpenChange(false);
  }, [onOpenChange]);

  /**
   * Handle keep editing
   */
  const handleKeepEditing = React.useCallback(() => {
    setShowUnsavedWarning(false);
  }, []);

  /**
   * Track form dirty state
   */
  React.useEffect(() => {
    // Reset dirty flag when modal opens
    if (open) {
      setIsDirty(false);
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit WiFi Settings</DialogTitle>
            <DialogDescription>
              Configure {iface.ssid || iface.name} ({iface.band})
            </DialogDescription>
          </DialogHeader>

          <WirelessSettingsForm
            currentValues={{
              ssid: iface.ssid || '',
              hideSsid: iface.hideSsid || false,
              channel: iface.channel || 'auto',
              channelWidth: iface.channelWidth || '20MHz',
              txPower: iface.txPower || 17,
              countryCode: iface.countryCode,
              band: iface.band,
            }}
            isSubmitting={updateMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <ConfirmationDialog
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        variant="destructive"
        onConfirm={handleDiscardChanges}
        onCancel={handleKeepEditing}
      />
    </>
  );
}

export const WirelessSettingsModal = React.memo(WirelessSettingsModalComponent);
WirelessSettingsModal.displayName = 'WirelessSettingsModal';
