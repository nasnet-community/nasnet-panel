/**
 * PPPoE Wizard - Step 3: Advanced Options
 * @description Configure MTU, MRU, DNS, and routing options for PPPoE connection
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Input, Switch, Button } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import {
  pppoeOptionsStepSchema,
  type PppoeOptionsStepFormValues,
  MTU_PRESETS,
} from '../../../schemas/pppoe-client.schema';
import { Settings, Zap } from 'lucide-react';

interface PppoeOptionsStepProps {
  /** Stepper hook for wizard navigation and state management */
  stepper: UseStepperReturn;
  /** Optional CSS class override */
  className?: string;
}

const DEFAULT_MTU_VALUE = 1492;
const DEFAULT_MRU_VALUE = 1492;
const DEFAULT_SHOULD_ADD_ROUTE = true;
const DEFAULT_SHOULD_USE_PEER_DNS = true;

/**
 * @description Advanced options step for PPPoE configuration
 */
export function PppoeOptionsStep({ stepper, className }: PppoeOptionsStepProps) {
  const form = useForm<PppoeOptionsStepFormValues>({
    resolver: zodResolver(pppoeOptionsStepSchema) as any,
    defaultValues: stepper.getStepData('options') || {
      mtu: DEFAULT_MTU_VALUE,
      mru: DEFAULT_MRU_VALUE,
      shouldAddDefaultRoute: DEFAULT_SHOULD_ADD_ROUTE,
      shouldUsePeerDNS: DEFAULT_SHOULD_USE_PEER_DNS,
      comment: '',
    },
  });

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  /**
   * Apply MTU preset and sync MRU
   */
  const handleApplyMTUPreset = useCallback(
    (mtu: number) => {
      form.setValue('mtu', mtu, { shouldDirty: true });
      form.setValue('mru', mtu, { shouldDirty: true }); // Usually same as MTU
    },
    [form]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* MTU/MRU Configuration */}
      <FormSection
        title="MTU & MRU Settings"
        description="Maximum Transmission Unit and Maximum Receive Unit configuration"
      >
        <div className="space-y-4">
          {/* MTU Presets */}
          <div>
            <Label className="mb-component-md gap-component-sm flex items-center">
              <Zap
                className="h-4 w-4"
                aria-hidden="true"
              />
              Quick Presets
            </Label>
            <div className="gap-component-sm grid grid-cols-2">
              {Object.entries(MTU_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyMTUPreset(preset.value)}
                  className={cn(
                    form.watch('mtu') === preset.value && 'border-primary bg-primary/10'
                  )}
                  aria-label={`Set MTU to ${preset.label} (${preset.value} bytes)`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* MTU Input */}
          <div>
            <div className="gap-component-sm mb-component-md flex items-center">
              <Label htmlFor="mtu">MTU (bytes)</Label>
              <FieldHelp field="mtu" />
            </div>
            <Input
              id="mtu"
              type="number"
              min={512}
              max={65535}
              step={8}
              className="category-networking font-mono"
              {...form.register('mtu', { valueAsNumber: true })}
              aria-describedby="mtu-error mtu-help"
            />
            {form.formState.errors.mtu && (
              <p
                id="mtu-error"
                className="text-error mt-component-xs text-sm"
                role="alert"
              >
                {form.formState.errors.mtu.message}
              </p>
            )}
            <p
              id="mtu-help"
              className="text-muted-foreground mt-component-xs text-xs"
            >
              Valid range: 512-65535 bytes (recommended: 1492 for PPPoE)
            </p>
          </div>

          {/* MRU Input */}
          <div>
            <div className="gap-component-sm mb-component-md flex items-center">
              <Label htmlFor="mru">MRU (bytes)</Label>
              <FieldHelp field="mru" />
            </div>
            <Input
              id="mru"
              type="number"
              min={512}
              max={65535}
              step={8}
              className="category-networking font-mono"
              {...form.register('mru', { valueAsNumber: true })}
              aria-describedby="mru-error mru-help"
            />
            {form.formState.errors.mru && (
              <p
                id="mru-error"
                className="text-error mt-component-xs text-sm"
                role="alert"
              >
                {form.formState.errors.mru.message}
              </p>
            )}
            <p
              id="mru-help"
              className="text-muted-foreground mt-component-xs text-xs"
            >
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
        <div className="space-y-component-md">
          {/* Add Default Route */}
          <div className="gap-component-lg flex items-center justify-between">
            <div className="gap-component-sm flex items-center">
              <Label htmlFor="add-default-route">Add Default Route</Label>
              <FieldHelp field="shouldAddDefaultRoute" />
            </div>
            <Switch
              id="add-default-route"
              checked={form.watch('shouldAddDefaultRoute')}
              onCheckedChange={(checked) =>
                form.setValue('shouldAddDefaultRoute', checked, { shouldDirty: true })
              }
              aria-label="Add default route via PPPoE gateway"
            />
          </div>

          {/* Use Peer DNS */}
          <div className="gap-component-lg flex items-center justify-between">
            <div className="gap-component-sm flex items-center">
              <Label htmlFor="use-peer-dns">Use Peer DNS</Label>
              <FieldHelp field="shouldUsePeerDNS" />
            </div>
            <Switch
              id="use-peer-dns"
              checked={form.watch('shouldUsePeerDNS')}
              onCheckedChange={(checked) =>
                form.setValue('shouldUsePeerDNS', checked, { shouldDirty: true })
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
        <div className="space-y-component-sm">
          <div className="gap-component-sm flex items-center">
            <Label htmlFor="comment">Comment</Label>
            <FieldHelp field="comment" />
          </div>
          <Input
            id="comment"
            type="text"
            maxLength={255}
            placeholder="e.g., Primary ISP Connection"
            {...form.register('comment')}
            aria-describedby="comment-error comment-help"
            className="category-networking"
          />
          {form.formState.errors.comment && (
            <p
              id="comment-error"
              className="text-error text-sm"
              role="alert"
            >
              {form.formState.errors.comment.message}
            </p>
          )}
          <p
            id="comment-help"
            className="text-muted-foreground text-xs"
          >
            {form.watch('comment')?.length || 0}/255 characters
          </p>
        </div>
      </FormSection>
    </div>
  );
}

PppoeOptionsStep.displayName = 'PppoeOptionsStep';
