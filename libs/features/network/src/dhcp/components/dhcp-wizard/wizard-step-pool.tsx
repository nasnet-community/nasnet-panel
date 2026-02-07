/**
 * DHCP Wizard - Step 2: Address Pool Configuration
 * Configure pool range with auto-suggestions and validation
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IPInput } from '@nasnet/ui/patterns';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { calculatePoolSize } from '../../utils/pool-calculator';
import { poolStepSchema, type PoolStepFormData } from './dhcp-wizard.schema';

interface WizardStepPoolProps {
  stepper: UseStepperReturn;
}

export function WizardStepPool({ stepper }: WizardStepPoolProps) {
  const previousData = stepper.getStepData('interface') as { suggestedPool?: any };
  const suggestion = previousData?.suggestedPool;

  const form = useForm<PoolStepFormData>({
    resolver: zodResolver(poolStepSchema),
    defaultValues: stepper.getStepData('pool') || {
      poolStart: suggestion?.start || '',
      poolEnd: suggestion?.end || '',
    },
  });

  const watchedStart = form.watch('poolStart');
  const watchedEnd = form.watch('poolEnd');

  // Calculate current pool size
  const currentPoolSize = watchedStart && watchedEnd
    ? calculatePoolSize(watchedStart, watchedEnd)
    : 0;

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className="space-y-6">
      <FormSection
        title="Configure Address Pool"
        description="Define the range of IP addresses to assign to DHCP clients"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="pool-start">
              Pool Start IP
              <FieldHelp>
                First IP address in the DHCP pool. Suggested: {suggestion?.start}
              </FieldHelp>
            </Label>
            <IPInput
              id="pool-start"
              {...form.register('poolStart')}
              error={form.formState.errors.poolStart?.message}
              placeholder="e.g., 192.168.1.100"
            />
          </div>

          <div>
            <Label htmlFor="pool-end">
              Pool End IP
              <FieldHelp>
                Last IP address in the DHCP pool. Suggested: {suggestion?.end}
              </FieldHelp>
            </Label>
            <IPInput
              id="pool-end"
              {...form.register('poolEnd')}
              error={form.formState.errors.poolEnd?.message}
              placeholder="e.g., 192.168.1.254"
            />
          </div>
        </div>
      </FormSection>

      {/* Calculated pool information */}
      {suggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pool Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-muted-foreground">Current Pool Size</Label>
                <p className="font-medium font-mono">{currentPoolSize} addresses</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Suggested Size</Label>
                <p className="font-medium font-mono">{suggestion.size} addresses</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Reserved for Static IPs</Label>
                <p className="font-medium font-mono text-xs">{suggestion.reserved}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Network Address</Label>
                <p className="font-medium font-mono text-xs">{suggestion.network}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Broadcast Address</Label>
                <p className="font-medium font-mono text-xs">{suggestion.broadcast}</p>
              </div>
            </div>

            {currentPoolSize > 0 && currentPoolSize !== suggestion.size && (
              <div className="rounded-md bg-info/10 border border-info/20 p-3">
                <p className="text-sm text-info-foreground">
                  ℹ️ You've customized the pool size. Make sure it doesn't overlap with static IP assignments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
