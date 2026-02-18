/**
 * DHCP Wizard - Step 1: Interface Selection
 * Select interface for DHCP server and auto-calculate pool suggestions
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterfaceSelector } from '@nasnet/ui/patterns';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
// Local interface type for wizard step
interface NetworkInterface {
  id: string;
  name: string;
  type: string;
  ipAddress?: string;
  running?: boolean;
}
import { calculateSuggestedPool } from '../../utils/pool-calculator';
import { interfaceStepSchema, type InterfaceStepFormData } from './dhcp-wizard.schema';

interface WizardStepInterfaceProps {
  stepper: UseStepperReturn;
  routerIp: string;
}

export function WizardStepInterface({ stepper, routerIp }: WizardStepInterfaceProps) {
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null);

  const form = useForm<InterfaceStepFormData>({
    resolver: zodResolver(interfaceStepSchema),
    defaultValues: stepper.getStepData('interface') || {},
  });

  // Handle interface selection
  const handleInterfaceSelect = (iface: NetworkInterface) => {
    setSelectedInterface(iface);
    form.setValue('interface', iface.name);

    // Store interface IP for later steps
    if (iface.ipAddress) {
      form.setValue('interfaceIP', iface.ipAddress);

      // Calculate suggested pool for next step
      try {
        const suggestion = calculateSuggestedPool(iface.ipAddress);

        // Pre-fill pool step data
        stepper.setStepData({
          interface: iface.name,
          interfaceIP: iface.ipAddress,
          suggestedPool: suggestion,
        });
      } catch (error) {
        console.error('Failed to calculate pool suggestion:', error);
      }
    }
  };

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.interface) {
        stepper.setStepData(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className="space-y-6">
      <FormSection
        title="Select Network Interface"
        description="Choose the interface where the DHCP server will operate"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="interface-selector">
              Interface
              <FieldHelp field="dhcp.interface" />
            </Label>
            <InterfaceSelector
              routerId={routerIp}
              value={selectedInterface?.id}
              onChange={(value: any) => {
                const iface = { id: value, name: value } as NetworkInterface;
                handleInterfaceSelect(iface);
              }}
            />
            {form.formState.errors.interface && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.interface.message}
              </p>
            )}
          </div>

          {selectedInterface && selectedInterface.ipAddress && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Selected Interface Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-mono">{selectedInterface.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="ml-2 font-mono">{selectedInterface.ipAddress}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">{selectedInterface.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">{selectedInterface.running ? 'Running' : 'Down'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}
