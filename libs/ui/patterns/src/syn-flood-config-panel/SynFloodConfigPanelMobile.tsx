/**
 * SynFloodConfigPanelMobile Component
 *
 * Mobile presenter for SYN flood protection configuration.
 * Touch-friendly layout with larger controls.
 */

import * as React from 'react';

import { FormProvider } from 'react-hook-form';

import {
  Button,
  Card,
  cn,
  Label,
  Slider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';

import { ConfirmationDialog } from '../confirmation-dialog';
import { SYN_FLOOD_PRESETS } from './types';

import type { UseSynFloodConfigPanelReturn } from './use-syn-flood-config-panel';

export interface SynFloodConfigPanelMobileProps {
  /** Config hook return value */
  configHook: UseSynFloodConfigPanelReturn;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Mobile presenter for SynFloodConfigPanel
 *
 * Features:
 * - 44px minimum touch targets
 * - Full-width controls
 * - Larger sliders for touch interaction
 * - Stacked layout
 */
export function SynFloodConfigPanelMobile({
  configHook,
  loading = false,
  className,
}: SynFloodConfigPanelMobileProps) {
  const { form, isDirty, isSubmitting, handleSubmit, handleReset, isLowSynLimit } = configHook;
  const [showEnableDialog, setShowEnableDialog] = React.useState(false);
  const [showResetDialog, setShowResetDialog] = React.useState(false);

  // Watch form fields
  const enabled = form.watch('enabled');
  const synLimit = form.watch('synLimit');
  const burst = form.watch('burst');
  const action = form.watch('action');
  const wasEnabled = React.useRef(enabled);

  // Handle enable/disable toggle
  const handleEnabledChange = React.useCallback(
    (value: boolean) => {
      if (value && !wasEnabled.current) {
        setShowEnableDialog(true);
      } else {
        form.setValue('enabled', value, { shouldDirty: true });
        wasEnabled.current = value;
      }
    },
    [form]
  );

  // Confirm enable
  const confirmEnable = React.useCallback(() => {
    form.setValue('enabled', true, { shouldDirty: true });
    wasEnabled.current = true;
    setShowEnableDialog(false);
  }, [form]);

  // Confirm reset
  const confirmReset = React.useCallback(() => {
    handleReset();
    setShowResetDialog(false);
  }, [handleReset]);

  // Apply preset
  const applyPreset = React.useCallback(
    (presetLabel: string) => {
      const preset = SYN_FLOOD_PRESETS.find((p) => p.label === presetLabel);
      if (preset) {
        form.setValue('synLimit', String(preset.synLimit), { shouldDirty: true });
        form.setValue('burst', String(preset.burst), { shouldDirty: true });
      }
    },
    [form]
  );

  // Generate preview text
  const previewText = React.useMemo(() => {
    const limitNum = parseInt(synLimit, 10);
    const burstNum = parseInt(burst, 10);
    if (isNaN(limitNum) || isNaN(burstNum)) return '';

    const actionText = action === 'drop' ? 'Drop' : 'Tarpit';
    return `${actionText} SYN packets exceeding ${limitNum}/s (burst: ${burstNum})`;
  }, [synLimit, burst, action]);

  // Show warning if limit is too low
  const showLowLimitWarning = enabled && isLowSynLimit();

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={cn('space-y-4', className)}
      >
        {/* Main Configuration Card */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">SYN Flood Protection</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Protect against SYN flood attacks by limiting incoming SYN packets.
          </p>

          <div className="space-y-4">
            {/* Master Toggle */}
            <div className="flex items-center gap-3 min-h-[44px]">
              <input
                type="checkbox"
                id="enabled-mobile"
                checked={enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300"
                aria-label="Enable SYN flood protection"
              />
              <label htmlFor="enabled-mobile" className="text-sm font-medium">
                Enable Protection
              </label>
            </div>

            {/* Warning for low limits */}
            {showLowLimitWarning && (
              <Alert variant="warning" role="alert">
                <AlertDescription className="text-sm">
                  Limit below 100/s may block legitimate traffic
                </AlertDescription>
              </Alert>
            )}

            {/* Presets Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="preset-mobile">Quick Presets</Label>
              <Select onValueChange={applyPreset} disabled={!enabled}>
                <SelectTrigger id="preset-mobile" className="w-full min-h-[44px]">
                  <SelectValue placeholder="Select preset..." />
                </SelectTrigger>
                <SelectContent>
                  {SYN_FLOOD_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label} ({preset.synLimit}/s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SYN Limit Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="synLimit-mobile">SYN Limit (per sec)</Label>
                <span
                  className="text-sm font-medium px-2 py-1 bg-muted rounded"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {synLimit}
                </span>
              </div>
              <Slider
                id="synLimit-mobile"
                min={1}
                max={10000}
                step={10}
                value={[parseInt(synLimit, 10) || 100]}
                onValueChange={(values) =>
                  form.setValue('synLimit', String(values[0]), { shouldDirty: true })
                }
                disabled={!enabled}
                className="py-2"
                aria-label="SYN limit"
                aria-valuetext={`${synLimit} packets per second`}
              />
              <p className="text-xs text-muted-foreground">
                Max packets per second (1-10,000)
              </p>
            </div>

            {/* Burst Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="burst-mobile">Burst</Label>
                <span
                  className="text-sm font-medium px-2 py-1 bg-muted rounded"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {burst}
                </span>
              </div>
              <Slider
                id="burst-mobile"
                min={1}
                max={1000}
                step={1}
                value={[parseInt(burst, 10) || 5]}
                onValueChange={(values) =>
                  form.setValue('burst', String(values[0]), { shouldDirty: true })
                }
                disabled={!enabled}
                className="py-2"
                aria-label="Burst limit"
                aria-valuetext={`${burst} packets`}
              />
              <p className="text-xs text-muted-foreground">
                Allowed burst (1-1,000)
              </p>
            </div>

            {/* Action Selector */}
            <div className="space-y-2">
              <Label htmlFor="action-mobile">Action</Label>
              <Select
                value={action}
                onValueChange={(value) =>
                  form.setValue('action', value as 'drop' | 'tarpit', { shouldDirty: true })
                }
                disabled={!enabled}
              >
                <SelectTrigger id="action-mobile" className="w-full min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drop">Drop</SelectItem>
                  <SelectItem value="tarpit">Tarpit</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {action === 'drop' ? 'Discard excess packets' : 'Slow down attacker'}
              </p>
            </div>

            {/* Preview */}
            {enabled && previewText && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-mono break-words">{previewText}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons - Full Width */}
        <div className="space-y-3">
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

      {/* Enable Confirmation Dialog */}
      <ConfirmationDialog
        open={showEnableDialog}
        onOpenChange={setShowEnableDialog}
        title="Enable SYN Flood Protection?"
        description="Enabling SYN flood protection may block legitimate high-traffic applications if the limit is too low. Continue?"
        confirmLabel="Enable"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmEnable}
        onCancel={() => setShowEnableDialog(false)}
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

SynFloodConfigPanelMobile.displayName = 'SynFloodConfigPanelMobile';
