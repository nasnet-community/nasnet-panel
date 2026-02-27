/**
 * PPPoE Wizard - Step 1: Interface Selection
 *
 * Select physical interface and PPPoE interface name.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect, useState, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterfaceSelector, FormSection, FieldHelp } from '@nasnet/ui/patterns';
import type { UseStepperReturn, RouterInterface } from '@nasnet/ui/patterns';
import { Label, Input } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import {
  pppoeInterfaceStepSchema,
  type PppoeInterfaceStepFormValues,
} from '../../../schemas/pppoe-client.schema';
import { Network } from 'lucide-react';

interface PppoeInterfaceStepProps {
  routerId: string;
  stepper: UseStepperReturn;
  className?: string;
}

export const PppoeInterfaceStep = memo(function PppoeInterfaceStep({
  routerId,
  stepper,
  className,
}: PppoeInterfaceStepProps) {
  const [selectedInterface, setSelectedInterface] = useState<RouterInterface | null>(
    null
  );

  const form = useForm<PppoeInterfaceStepFormValues>({
    resolver: zodResolver(pppoeInterfaceStepSchema),
    defaultValues: stepper.getStepData('interface') || {
      name: 'pppoe-wan',
      interface: '',
    },
  });

  /**
   * Handle interface selection
   */
  const handleInterfaceSelect = useCallback((value: string | string[]) => {
    const selectedId = Array.isArray(value) ? value[0] : value;
    // In a real implementation, we'd fetch the interface details by ID
    // For now, we just store the ID
    form.setValue('interface', selectedId, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form]);

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className={cn('space-y-6', className)}>
      <FormSection
        title="PPPoE Interface Configuration"
        description="Select the physical interface and provide a name for the PPPoE connection"
      >
        <div className="space-y-component-md">
          {/* PPPoE Interface Name */}
          <div>
            <div className="flex items-center gap-component-sm mb-component-md">
              <Label htmlFor="pppoe-name">
                <Network className="inline h-4 w-4 mr-component-xs" aria-hidden="true" />
                PPPoE Interface Name
              </Label>
              <FieldHelp field="name" />
            </div>
            <Input
              id="pppoe-name"
              type="text"
              placeholder="pppoe-wan"
              {...form.register('name')}
              aria-describedby="name-error name-help"
              className="font-mono text-sm category-networking"
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-error mt-component-xs" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
            <p id="name-help" className="text-xs text-muted-foreground mt-component-xs">
              Letters, numbers, hyphens, and underscores only (max 64 characters)
            </p>
          </div>

          {/* Physical Interface Selection */}
          <div>
            <div className="flex items-center gap-component-sm mb-component-md">
              <Label htmlFor="interface-selector">Physical Interface</Label>
              <FieldHelp field="interface" aria-label="Help about physical interface selection" />
            </div>
            <InterfaceSelector
              id="interface-selector"
              routerId={routerId}
              value={form.watch('interface')}
              onChange={handleInterfaceSelect}
              types={['ethernet']}
            />
            {form.formState.errors.interface && (
              <p
                className="text-sm text-error mt-1"
                role="alert"
                id="interface-error"
              >
                {form.formState.errors.interface.message}
              </p>
            )}
          </div>

          {/* Selected Interface Details */}
          {selectedInterface && (
            <div className="rounded-lg border bg-muted/50 p-component-md space-y-component-sm category-networking">
              <h4 className="font-medium text-sm">
                Selected Interface Details
              </h4>
              <div className="grid grid-cols-2 gap-component-sm text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-component-md font-mono text-xs">
                    {selectedInterface.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-component-md">{selectedInterface.type}</span>
                </div>
                {selectedInterface.mac && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">MAC:</span>
                    <span className="ml-component-md font-mono text-xs">
                      {selectedInterface.mac}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-component-md border-t">
                <strong>Note:</strong> PPPoE will create a virtual interface named{' '}
                <code className="bg-muted px-component-xs py-0.5 rounded font-mono text-xs">
                  {form.watch('name')}
                </code>{' '}
                bound to this physical interface.
              </p>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
});

PppoeInterfaceStep.displayName = 'PppoeInterfaceStep';
