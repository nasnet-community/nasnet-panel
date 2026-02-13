/**
 * SynFloodConfigPanelDesktop Component
 *
 * Desktop presenter for SYN flood protection configuration.
 * Compact form layout with sliders and preset dropdown.
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

export interface SynFloodConfigPanelDesktopProps {
  /** Config hook return value */
  configHook: UseSynFloodConfigPanelReturn;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Desktop presenter for SynFloodConfigPanel
 *
 * Features:
 * - Master toggle with dangerous confirmation
 * - SYN limit slider (1-10,000 packets/second)
 * - Burst slider (1-1,000)
 * - Action selector (drop/tarpit)
 * - Presets dropdown
 * - Warning for low limits
 */
export function SynFloodConfigPanelDesktop({
  configHook,
  loading = false,
  className,
}: SynFloodConfigPanelDesktopProps) {
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
        // Enabling - show confirmation
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
        className={cn('space-y-6', className)}
      >
        {/* Main Configuration Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">SYN Flood Protection</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Protect against SYN flood attacks by limiting incoming SYN packets per second.
            Uses RouterOS RAW firewall table for efficient processing.
          </p>

          <div className="space-y-6">
            {/* Master Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                aria-label="Enable SYN flood protection"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Enable SYN Flood Protection
              </label>
            </div>

            {/* Warning for low limits */}
            {showLowLimitWarning && (
              <Alert variant="warning" role="alert">
                <AlertDescription>
                  SYN limit below 100/s may block legitimate high-traffic applications and services.
                </AlertDescription>
              </Alert>
            )}

            {/* Presets Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="preset">Quick Presets</Label>
              <Select onValueChange={applyPreset} disabled={!enabled}>
                <SelectTrigger id="preset" className="w-full">
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {SYN_FLOOD_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label} ({preset.synLimit}/s, burst: {preset.burst})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SYN Limit Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="synLimit">SYN Limit (packets/second)</Label>
                <span className="text-sm font-medium" aria-live="polite" aria-atomic="true">
                  {synLimit}
                </span>
              </div>
              <Slider
                id="synLimit"
                min={1}
                max={10000}
                step={10}
                value={[parseInt(synLimit, 10) || 100]}
                onValueChange={(values) =>
                  form.setValue('synLimit', String(values[0]), { shouldDirty: true })
                }
                disabled={!enabled}
                aria-label="SYN limit"
                aria-valuetext={`${synLimit} packets per second`}
              />
              <p className="text-xs text-muted-foreground">
                Maximum SYN packets allowed per second (1-10,000)
              </p>
            </div>

            {/* Burst Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="burst">Burst</Label>
                <span className="text-sm font-medium" aria-live="polite" aria-atomic="true">
                  {burst}
                </span>
              </div>
              <Slider
                id="burst"
                min={1}
                max={1000}
                step={1}
                value={[parseInt(burst, 10) || 5]}
                onValueChange={(values) =>
                  form.setValue('burst', String(values[0]), { shouldDirty: true })
                }
                disabled={!enabled}
                aria-label="Burst limit"
                aria-valuetext={`${burst} packets`}
              />
              <p className="text-xs text-muted-foreground">
                Allowed burst above the limit (1-1,000)
              </p>
            </div>

            {/* Action Selector */}
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={action}
                onValueChange={(value) =>
                  form.setValue('action', value as 'drop' | 'tarpit', { shouldDirty: true })
                }
                disabled={!enabled}
              >
                <SelectTrigger id="action" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drop">Drop (discard immediately)</SelectItem>
                  <SelectItem value="tarpit">Tarpit (slow down attacker)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {action === 'drop'
                  ? 'Drop excess SYN packets immediately'
                  : 'Slow down excess connections (uses more resources)'}
              </p>
            </div>

            {/* Preview */}
            {enabled && previewText && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono">{previewText}</p>
              </div>
            )}
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
            <Button type="submit" disabled={!isDirty || isSubmitting || loading}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {/* Enable Confirmation Dialog */}
      <ConfirmationDialog
        open={showEnableDialog}
        onOpenChange={setShowEnableDialog}
        title="Enable SYN Flood Protection?"
        description="Enabling SYN flood protection will drop or tarpit SYN packets that exceed the configured limit. If the limit is too low, this may block legitimate high-traffic applications. Are you sure you want to continue?"
        confirmLabel="Enable Protection"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmEnable}
        onCancel={() => setShowEnableDialog(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset to Default Values?"
        description="This will reset all SYN flood protection settings to their default values. Any unsaved changes will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </FormProvider>
  );
}

SynFloodConfigPanelDesktop.displayName = 'SynFloodConfigPanelDesktop';
