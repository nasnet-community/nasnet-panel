/**
 * PPPoE Wizard - Step 1: Interface Selection
 *
 * Select physical interface and PPPoE interface name.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterfaceSelector, FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Input } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import type { RouterInterface } from '@nasnet/ui/patterns';
import {
  pppoeInterfaceStepSchema,
  type PppoeInterfaceStepFormValues,
} from '../../../schemas/pppoe-client.schema';
import { Network } from 'lucide-react';

interface PppoeInterfaceStepProps {
  routerId: string;
  stepper: UseStepperReturn;
}

export function PppoeInterfaceStep({
  routerId,
  stepper,
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

  // Handle interface selection
  const handleInterfaceSelect = (value: string | string[]) => {
    const selectedId = Array.isArray(value) ? value[0] : value;
    // In a real implementation, we'd fetch the interface details by ID
    // For now, we just store the ID
    form.setValue('interface', selectedId, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Auto-save form data to stepper
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className="space-y-6">
      <FormSection
        title="PPPoE Interface Configuration"
        description="Select the physical interface and provide a name for the PPPoE connection"
      >
        <div className="space-y-4">
          {/* PPPoE Interface Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="pppoe-name">
                <Network className="inline h-4 w-4 mr-1" />
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
            />
            {form.formState.errors.name && (
              <p id="name-error" className="text-sm text-error mt-1" role="alert">
                {form.formState.errors.name.message}
              </p>
            )}
            <p id="name-help" className="text-xs text-muted-foreground mt-1">
              Letters, numbers, hyphens, and underscores only (max 64 characters)
            </p>
          </div>

          {/* Physical Interface Selection */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="interface-selector">Physical Interface</Label>
              <FieldHelp field="interface" />
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
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">
                Selected Interface Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-mono">
                    {selectedInterface.name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">{selectedInterface.type}</span>
                </div>
                {selectedInterface.mac && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">MAC:</span>
                    <span className="ml-2 font-mono">
                      {selectedInterface.mac}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                <strong>Note:</strong> PPPoE will create a virtual interface named{' '}
                <code className="bg-muted px-1 py-0.5 rounded">
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
}
