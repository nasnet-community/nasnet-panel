/**
 * ConnectionTrackingSettingsDesktop Component
 *
 * Desktop presenter for connection tracking settings form.
 * Standard form layout with grouped timeout settings.
 */

import * as React from 'react';

import { FormProvider } from 'react-hook-form';

import { Button, Card, cn } from '@nasnet/ui/primitives';

import { ConfirmationDialog } from '../confirmation-dialog';
import { RHFFormField } from '../rhf-form-field';

import type { UseConnectionTrackingSettingsReturn } from './use-connection-tracking-settings';

export interface ConnectionTrackingSettingsDesktopProps {
  /** Settings hook return value */
  settingsHook: UseConnectionTrackingSettingsReturn;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Desktop presenter for ConnectionTrackingSettings
 *
 * Features:
 * - Tabbed/grouped layout for timeout settings
 * - Real-time validation with Zod
 * - Dangerous level confirmation (orange) for disabling tracking
 * - Reset to defaults button
 */
export function ConnectionTrackingSettingsDesktop({
  settingsHook,
  loading = false,
  className,
}: ConnectionTrackingSettingsDesktopProps) {
  const { form, isDirty, isSubmitting, handleSubmit, handleReset } = settingsHook;
  const [showDisableDialog, setShowDisableDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Watch enabled field to show confirmation when disabling
  const enabled = form.watch('enabled');
  const wasEnabled = React.useRef(enabled);

  // Handle enable/disable toggle
  const handleEnabledChange = React.useCallback(
    (value: boolean) => {
      if (!value && wasEnabled.current) {
        // Disabling - show confirmation
        setShowDisableDialog(true);
      } else {
        form.setValue('enabled', value, { shouldDirty: true });
        wasEnabled.current = value;
      }
    },
    [form]
  );

  // Confirm disable
  const confirmDisable = React.useCallback(() => {
    form.setValue('enabled', false, { shouldDirty: true });
    wasEnabled.current = false;
    setShowDisableDialog(false);
  }, [form]);

  // Confirm reset
  const confirmReset = React.useCallback(() => {
    handleReset();
    setShowResetDialog(false);
  }, [handleReset]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={cn('space-y-6', className)}
      >
        {/* General Settings Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                aria-label="Enable connection tracking"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Enable Connection Tracking
              </label>
            </div>

            <RHFFormField
              name="maxEntries"
              label="Maximum Entries"
              description="Maximum number of connections to track (1-10,000,000)"
              placeholder="262144"
              type="number"
              required
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...form.register('looseTracking')}
                id="looseTracking"
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="looseTracking" className="text-sm">
                Use loose TCP connection tracking
              </label>
            </div>
          </div>
        </Card>

        {/* TCP Timeouts Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">TCP Timeouts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use formats like: 1d (day), 12h (hours), 30m (minutes), 45s (seconds)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RHFFormField
              name="tcpEstablishedTimeout"
              label="Established"
              description="Active TCP connections"
              placeholder="1d"
              required
            />
            <RHFFormField
              name="tcpSynSentTimeout"
              label="SYN-SENT"
              description="Outgoing connection attempts"
              placeholder="120s"
              required
            />
            <RHFFormField
              name="tcpSynReceivedTimeout"
              label="SYN-RECEIVED"
              description="Incoming connection attempts"
              placeholder="60s"
              required
            />
            <RHFFormField
              name="tcpFinWaitTimeout"
              label="FIN-WAIT"
              description="Connection closing (FIN sent)"
              placeholder="120s"
              required
            />
            <RHFFormField
              name="tcpTimeWaitTimeout"
              label="TIME-WAIT"
              description="Connection fully closed"
              placeholder="120s"
              required
            />
            <RHFFormField
              name="tcpCloseTimeout"
              label="CLOSE"
              description="Closed connections"
              placeholder="10s"
              required
            />
            <RHFFormField
              name="tcpCloseWaitTimeout"
              label="CLOSE-WAIT"
              description="Waiting for close"
              placeholder="60s"
              required
            />
            <RHFFormField
              name="tcpLastAckTimeout"
              label="LAST-ACK"
              description="Final ACK waiting"
              placeholder="30s"
              required
            />
          </div>
        </Card>

        {/* Other Protocol Timeouts Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Other Protocol Timeouts</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RHFFormField
              name="udpTimeout"
              label="UDP"
              description="UDP connection timeout"
              placeholder="3m"
              required
            />
            <RHFFormField
              name="udpStreamTimeout"
              label="UDP Stream"
              description="UDP stream timeout"
              placeholder="3m"
              required
            />
            <RHFFormField
              name="icmpTimeout"
              label="ICMP"
              description="ICMP connection timeout"
              placeholder="30s"
              required
            />
            <RHFFormField
              name="genericTimeout"
              label="Generic"
              description="Other protocols timeout"
              placeholder="10m"
              required
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={!isDirty || isSubmitting}
          >
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting || loading}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* Disable Confirmation Dialog */}
      <ConfirmationDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        title="Disable Connection Tracking?"
        description="Disabling connection tracking will remove all existing connection entries and may affect firewall rules that depend on connection state. This is a potentially dangerous operation."
        confirmLabel="Disable Tracking"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDisable}
        onCancel={() => setShowDisableDialog(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset to Default Values?"
        description="This will reset all connection tracking settings to their default values. Any unsaved changes will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </FormProvider>
  );
}

ConnectionTrackingSettingsDesktop.displayName = 'ConnectionTrackingSettingsDesktop';
