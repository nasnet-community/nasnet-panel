/**
 * PPPoE Wizard - Step 3: Advanced Options
 *
 * Configure MTU, MRU, DNS, and routing options.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Input, Switch, Button } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import {
  pppoeOptionsStepSchema,
  type PppoeOptionsStepFormValues,
  MTU_PRESETS,
} from '../../../schemas/pppoe-client.schema';
import { Settings, Zap } from 'lucide-react';

interface PppoeOptionsStepProps {
  stepper: UseStepperReturn;
}

export function PppoeOptionsStep({ stepper }: PppoeOptionsStepProps) {
  const form = useForm<PppoeOptionsStepFormValues>({
    resolver: zodResolver(pppoeOptionsStepSchema),
    defaultValues: stepper.getStepData('options') || {
      mtu: 1492,
      mru: 1492,
      addDefaultRoute: true,
      usePeerDNS: true,
      comment: '',
    },
  });

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData('options', value);
      stepper.markStepAsValid('options');
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  /**
   * Apply MTU preset and sync MRU
   */
  const applyMTUPreset = (mtu: number) => {
    form.setValue('mtu', mtu, { shouldDirty: true });
    form.setValue('mru', mtu, { shouldDirty: true }); // Usually same as MTU
  };

  return (
    <div className="space-y-6">
      {/* MTU/MRU Configuration */}
      <FormSection
        title="MTU & MRU Settings"
        description="Maximum Transmission Unit and Maximum Receive Unit configuration"
      >
        <div className="space-y-4">
          {/* MTU Presets */}
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Presets
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MTU_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyMTUPreset(preset.value)}
                  className={
                    form.watch('mtu') === preset.value
                      ? 'border-primary bg-primary/10'
                      : ''
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* MTU Input */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="mtu">MTU (bytes)</Label>
              <FieldHelp
                field="mtu"
                text="Maximum Transmission Unit. Standard PPPoE uses 1492 bytes (1500 - 8 byte overhead). Lower values may improve stability but reduce throughput."
              />
            </div>
            <Input
              id="mtu"
              type="number"
              min={512}
              max={65535}
              step={8}
              {...form.register('mtu', { valueAsNumber: true })}
              aria-describedby="mtu-error mtu-help"
            />
            {form.formState.errors.mtu && (
              <p id="mtu-error" className="text-sm text-error mt-1" role="alert">
                {form.formState.errors.mtu.message}
              </p>
            )}
            <p id="mtu-help" className="text-xs text-muted-foreground mt-1">
              Valid range: 512-65535 bytes (recommended: 1492 for PPPoE)
            </p>
          </div>

          {/* MRU Input */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="mru">MRU (bytes)</Label>
              <FieldHelp
                field="mru"
                text="Maximum Receive Unit. Should typically match MTU. Only change if required by your ISP."
              />
            </div>
            <Input
              id="mru"
              type="number"
              min={512}
              max={65535}
              step={8}
              {...form.register('mru', { valueAsNumber: true })}
              aria-describedby="mru-error mru-help"
            />
            {form.formState.errors.mru && (
              <p id="mru-error" className="text-sm text-error mt-1" role="alert">
                {form.formState.errors.mru.message}
              </p>
            )}
            <p id="mru-help" className="text-xs text-muted-foreground mt-1">
              Valid range: 512-65535 bytes (usually same as MTU)
            </p>
          </div>
        </div>
      </FormSection>

      {/* Routing & DNS Configuration */}
      <FormSection
        title="Routing & DNS"
        description="Configure default route and DNS settings"
      >
        <div className="space-y-4">
          {/* Add Default Route */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="add-default-route">Add Default Route</Label>
              <FieldHelp
                field="addDefaultRoute"
                text="Automatically add default route via PPPoE gateway. Required for internet access via this connection."
              />
            </div>
            <Switch
              id="add-default-route"
              checked={form.watch('addDefaultRoute')}
              onCheckedChange={(checked) =>
                form.setValue('addDefaultRoute', checked, { shouldDirty: true })
              }
              aria-label="Add default route via PPPoE gateway"
            />
          </div>

          {/* Use Peer DNS */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="use-peer-dns">Use Peer DNS</Label>
              <FieldHelp
                field="usePeerDNS"
                text="Use DNS servers provided by your ISP via PPPoE. Recommended unless you have specific DNS requirements."
              />
            </div>
            <Switch
              id="use-peer-dns"
              checked={form.watch('usePeerDNS')}
              onCheckedChange={(checked) =>
                form.setValue('usePeerDNS', checked, { shouldDirty: true })
              }
              aria-label="Use DNS servers from ISP"
            />
          </div>
        </div>
      </FormSection>

      {/* Optional Comment */}
      <FormSection
        title="Identification"
        description="Optional comment for this connection"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="comment">Comment</Label>
            <FieldHelp
              field="comment"
              text="Optional description for this PPPoE connection (max 255 characters)."
            />
          </div>
          <Input
            id="comment"
            type="text"
            maxLength={255}
            placeholder="e.g., Primary ISP Connection"
            {...form.register('comment')}
            aria-describedby="comment-error comment-help"
          />
          {form.formState.errors.comment && (
            <p
              id="comment-error"
              className="text-sm text-error"
              role="alert"
            >
              {form.formState.errors.comment.message}
            </p>
          )}
          <p id="comment-help" className="text-xs text-muted-foreground">
            {form.watch('comment')?.length || 0}/255 characters
          </p>
        </div>
      </FormSection>
    </div>
  );
}
