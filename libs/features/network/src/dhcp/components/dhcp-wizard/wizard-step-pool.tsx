/**
 * DHCP Wizard - Step 2: Address Pool Configuration
 * Configure DHCP address pool range with auto-suggestions and real-time validation.
 *
 * @description Enables users to define the IP address range for DHCP client assignments.
 * Provides intelligent default suggestions based on interface IP, real-time pool size calculation,
 * and validation to prevent overlaps with reserved addresses. Visual feedback shows network
 * topology and available address capacity.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useEffect, useCallback, useMemo, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IPInput, FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { calculatePoolSize } from '../../utils/pool-calculator';
import { poolStepSchema, type PoolStepFormData } from './dhcp-wizard.schema';

/**
 * Suggested pool configuration from interface selection step
 */
interface SuggestedPool {
  start: string;
  end: string;
  size: number;
  reserved: string;
  network: string;
  broadcast: string;
}

/**
 * Props for WizardStepPool component
 */
interface WizardStepPoolProps {
  /** Stepper instance providing access to wizard step data */
  stepper: UseStepperReturn;
  /** Optional CSS class names to apply to root container */
  className?: string;
}

/**
 * Pool configuration step component - allows users to define DHCP address pool range
 */
function WizardStepPoolComponent({ stepper, className }: WizardStepPoolProps) {
  const previousData = stepper.getStepData('interface') as { suggestedPool?: SuggestedPool };
  const suggestion = previousData?.suggestedPool;

  const form = useForm<PoolStepFormData>({
    resolver: zodResolver(poolStepSchema),
    defaultValues: stepper.getStepData('pool') || {
      poolStart: (suggestion?.start as string) || '',
      poolEnd: (suggestion?.end as string) || '',
    },
  });

  const watchedStart = form.watch('poolStart');
  const watchedEnd = form.watch('poolEnd');

  // Memoized pool size calculation
  const currentPoolSize = useMemo(() => {
    return watchedStart && watchedEnd
      ? calculatePoolSize(watchedStart, watchedEnd)
      : 0;
  }, [watchedStart, watchedEnd]);

  // Handle pool start change
  const handlePoolStartChange = useCallback((value: string) => {
    form.setValue('poolStart', value);
  }, [form]);

  // Handle pool end change
  const handlePoolEndChange = useCallback((value: string) => {
    form.setValue('poolEnd', value);
  }, [form]);

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <FormSection
        title="Configure Address Pool"
        description="Define the range of IP addresses to assign to DHCP clients"
      >
        <div className="space-y-component-md">
          <div>
            <Label htmlFor="pool-start">
              Pool Start IP
              <FieldHelp field="dhcp.poolStart" />
            </Label>
            <IPInput
              value={form.watch('poolStart') || ''}
              onChange={handlePoolStartChange}
              placeholder="e.g., 192.168.1.100"
            />
          </div>

          <div>
            <Label htmlFor="pool-end">
              Pool End IP
              <FieldHelp field="dhcp.poolEnd" />
            </Label>
            <IPInput
              value={form.watch('poolEnd') || ''}
              onChange={handlePoolEndChange}
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
          <CardContent className="space-y-component-sm">
            <div className="grid grid-cols-2 gap-component-sm text-sm">
              <div>
                <Label className="text-muted-foreground">Current Pool Size</Label>
                <p className="font-medium font-mono">{currentPoolSize} addresses</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Suggested Size</Label>
                <p className="font-medium font-mono">{String(suggestion.size)} addresses</p>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground">Reserved for Static IPs</Label>
                <p className="font-medium font-mono text-xs">{String(suggestion.reserved)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Network Address</Label>
                <p className="font-medium font-mono text-xs">{String(suggestion.network)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Broadcast Address</Label>
                <p className="font-medium font-mono text-xs">{String(suggestion.broadcast)}</p>
              </div>
            </div>

            {currentPoolSize > 0 && currentPoolSize !== (suggestion.size as number) && (
              <div className="rounded-[var(--semantic-radius-button)] bg-info/10 border border-info/20 p-component-sm">
                <p className="text-sm text-info-foreground">
                  Info: You've customized the pool size. Make sure it doesn't overlap with static IP assignments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Wrap with React.memo and set displayName for debugging
export const WizardStepPool = memo(WizardStepPoolComponent);
WizardStepPool.displayName = 'WizardStepPool';
