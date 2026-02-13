/**
 * ConnectionTrackingSettingsMobile Component
 *
 * Mobile presenter for connection tracking settings form.
 * Accordion-based layout to reduce vertical space.
 */

import * as React from 'react';

import { FormProvider } from 'react-hook-form';

import {
  Button,
  Card,
  cn,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nasnet/ui/primitives';
import { RHFFormField } from '../rhf-form-field';
import { ConfirmationDialog } from '../confirmation-dialog';

import type { UseConnectionTrackingSettingsReturn } from './use-connection-tracking-settings';

export interface ConnectionTrackingSettingsMobileProps {
  /** Settings hook return value */
  settingsHook: UseConnectionTrackingSettingsReturn;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Mobile presenter for ConnectionTrackingSettings
 *
 * Features:
 * - Accordion layout for grouped settings
 * - 44px minimum touch targets
 * - Full-width buttons
 * - Collapsible timeout sections
 */
export function ConnectionTrackingSettingsMobile({
  settingsHook,
  loading = false,
  className,
}: ConnectionTrackingSettingsMobileProps) {
  const { form, isDirty, isSubmitting, handleSubmit, handleReset } = settingsHook;
  const [showDisableDialog, setShowDisableDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Watch enabled field
  const enabled = form.watch('enabled');
  const wasEnabled = React.useRef(enabled);

  // Handle enable/disable toggle
  const handleEnabledChange = React.useCallback(
    (value: boolean) => {
      if (!value && wasEnabled.current) {
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
        className={cn('space-y-4', className)}
      >
        {/* General Settings */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 min-h-[44px]">
              <input
                type="checkbox"
                id="enabled-mobile"
                checked={enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
                aria-label="Enable connection tracking"
              />
              <label htmlFor="enabled-mobile" className="text-sm font-medium">
                Enable Connection Tracking
              </label>
            </div>

            <RHFFormField
              name="maxEntries"
              label="Maximum Entries"
              description="Maximum number of connections (1-10M)"
              placeholder="262144"
              type="number"
              required
            />

            <div className="flex items-center gap-3 min-h-[44px]">
              <input
                type="checkbox"
                {...form.register('trackLocal')}
                id="trackLocal-mobile"
                className="h-5 w-5 rounded border-gray-300"
              />
              <label htmlFor="trackLocal-mobile" className="text-sm">
                Track local traffic
              </label>
            </div>

            <div className="flex items-center gap-3 min-h-[44px]">
              <input
                type="checkbox"
                {...form.register('looseTracking')}
                id="looseTracking-mobile"
                className="h-5 w-5 rounded border-gray-300"
              />
              <label htmlFor="looseTracking-mobile" className="text-sm">
                Loose TCP tracking
              </label>
            </div>
          </div>
        </Card>

        {/* Timeout Settings - Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {/* TCP Timeouts */}
          <AccordionItem value="tcp" className="border rounded-lg">
            <AccordionTrigger className="px-4 min-h-[44px]">
              <span className="font-semibold">TCP Timeouts</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-3">
                Format: 1d, 12h, 30m, 45s
              </p>
              <div className="space-y-3">
                <RHFFormField
                  name="tcpEstablishedTimeout"
                  label="Established"
                  placeholder="1d"
                  required
                />
                <RHFFormField
                  name="tcpSynSentTimeout"
                  label="SYN-SENT"
                  placeholder="120s"
                  required
                />
                <RHFFormField
                  name="tcpSynReceivedTimeout"
                  label="SYN-RECEIVED"
                  placeholder="60s"
                  required
                />
                <RHFFormField
                  name="tcpFinWaitTimeout"
                  label="FIN-WAIT"
                  placeholder="120s"
                  required
                />
                <RHFFormField
                  name="tcpTimeWaitTimeout"
                  label="TIME-WAIT"
                  placeholder="120s"
                  required
                />
                <RHFFormField
                  name="tcpCloseTimeout"
                  label="CLOSE"
                  placeholder="10s"
                  required
                />
                <RHFFormField
                  name="tcpCloseWaitTimeout"
                  label="CLOSE-WAIT"
                  placeholder="60s"
                  required
                />
                <RHFFormField
                  name="tcpLastAckTimeout"
                  label="LAST-ACK"
                  placeholder="30s"
                  required
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Other Protocol Timeouts */}
          <AccordionItem value="other" className="border rounded-lg">
            <AccordionTrigger className="px-4 min-h-[44px]">
              <span className="font-semibold">Other Protocol Timeouts</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <RHFFormField
                  name="udpTimeout"
                  label="UDP"
                  placeholder="3m"
                  required
                />
                <RHFFormField
                  name="udpStreamTimeout"
                  label="UDP Stream"
                  placeholder="3m"
                  required
                />
                <RHFFormField
                  name="icmpTimeout"
                  label="ICMP"
                  placeholder="30s"
                  required
                />
                <RHFFormField
                  name="genericTimeout"
                  label="Generic"
                  placeholder="10m"
                  required
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons - Full Width */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={!isDirty || isSubmitting}
            className="w-full min-h-[44px]"
          >
            Reset to Defaults
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty || isSubmitting}
            className="w-full min-h-[44px]"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || loading}
            className="w-full min-h-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Disable Confirmation Dialog */}
      <ConfirmationDialog
        open={showDisableDialog}
        onOpenChange={setShowDisableDialog}
        title="Disable Connection Tracking?"
        description="This will remove all connection entries and may affect firewall rules. This is a potentially dangerous operation."
        confirmLabel="Disable"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDisable}
        onCancel={() => setShowDisableDialog(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset to Defaults?"
        description="All settings will be reset to default values. Unsaved changes will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </FormProvider>
  );
}

ConnectionTrackingSettingsMobile.displayName = 'ConnectionTrackingSettingsMobile';
