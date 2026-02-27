/**
 * DHCP Wizard - Step 1: Interface Selection
 * Select interface for DHCP server and auto-calculate pool suggestions.
 *
 * @description Allows users to select a network interface for DHCP server deployment.
 * Automatically fetches interface details, displays IP address information, and calculates
 * suggested address pool ranges based on the interface IP. Pre-fills subsequent step data
 * with intelligent defaults to accelerate wizard completion.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterfaceSelector, FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { calculateSuggestedPool } from '../../utils/pool-calculator';
import { interfaceStepSchema, type InterfaceStepFormData } from './dhcp-wizard.schema';

/**
 * Local interface type for wizard step
 */
interface NetworkInterface {
  id: string;
  name: string;
  type: string;
  ipAddress?: string;
  running?: boolean;
}

interface WizardStepInterfaceProps {
  /** Stepper instance providing access to wizard step data */
  stepper: UseStepperReturn;
  /** Router IP address for interface queries */
  routerIp: string;
  /** Optional CSS class names to apply to root container */
  className?: string;
}

/**
 * Interface selection step component
 */
function WizardStepInterfaceComponent({ stepper, routerIp, className }: WizardStepInterfaceProps) {
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null);

  const form = useForm<InterfaceStepFormData>({
    resolver: zodResolver(interfaceStepSchema),
    defaultValues: stepper.getStepData('interface') || {},
  });

  // Memoized interface selection handler
  const handleInterfaceSelect = useCallback((iface: NetworkInterface) => {
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
  }, [form, stepper]);

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.interface) {
        stepper.setStepData(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  // Memoized interface selector change handler
  const handleSelectorChange = useCallback((value: string | string[]) => {
    if (!value) return;
    const interfaceId = typeof value === 'string' ? value : value[0];
    const iface = { id: interfaceId, name: interfaceId } as NetworkInterface;
    handleInterfaceSelect(iface);
  }, [handleInterfaceSelect]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <FormSection
        title="Select Network Interface"
        description="Choose the interface where the DHCP server will operate"
      >
        <div className="space-y-component-md">
          <div>
            <Label htmlFor="interface-selector">
              Interface
              <FieldHelp field="dhcp.interface" />
            </Label>
            <InterfaceSelector
              routerId={routerIp}
              value={selectedInterface?.id}
              onChange={handleSelectorChange}
            />
            {form.formState.errors.interface && (
              <p className="text-sm text-error mt-component-xs">
                {form.formState.errors.interface.message}
              </p>
            )}
          </div>

          {selectedInterface && selectedInterface.ipAddress && (
            <div className="rounded-[var(--semantic-radius-card)] border border-border bg-background p-component-md space-y-component-sm">
              <h4 className="font-medium text-sm">Selected Interface Details</h4>
              <div className="grid grid-cols-2 gap-component-sm text-sm">
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

WizardStepInterfaceComponent.displayName = 'WizardStepInterface';

/**
 * Exported interface selection step component
 */
export const WizardStepInterface = WizardStepInterfaceComponent;
