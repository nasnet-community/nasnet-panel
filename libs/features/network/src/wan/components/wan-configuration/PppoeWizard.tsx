/**
 * PPPoE Client Configuration Wizard
 *
 * Multi-step wizard for configuring PPPoE WAN connection (5 steps):
 * 1. Interface selection
 * 2. Credentials (username/password)
 * 3. Advanced options (MTU, MRU, DNS, routing)
 * 4. Preview (RouterOS commands)
 * 5. Apply & Confirm
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useState } from 'react';
import { useStepper, VStepper } from '@nasnet/ui/patterns';
import type { StepConfig } from '@nasnet/ui/patterns';
import { Button } from '@nasnet/ui/primitives';
import { useConfigurePppoeWAN } from '@nasnet/api-client/queries';
import { PppoeInterfaceStep } from './wizard-steps/PppoeInterfaceStep';
import { PppoeCredentialsStep } from './wizard-steps/PppoeCredentialsStep';
import { PppoeOptionsStep } from './wizard-steps/PppoeOptionsStep';
import { PppoePreviewStep } from './wizard-steps/PppoePreviewStep';
import { PppoeConfirmStep } from './wizard-steps/PppoeConfirmStep';
import type { PppoeClientFormValues } from '../../schemas/pppoe-client.schema';

/**
 * PPPoE Wizard Props
 */
export interface PppoeWizardProps {
  /** Router ID for configuration */
  routerId: string;
  /** Callback when wizard is completed successfully */
  onComplete?: (result: any) => void;
  /** Callback when wizard is cancelled */
  onCancel?: () => void;
}

/**
 * PPPoE Configuration Wizard
 *
 * Guides user through PPPoE WAN setup with safety checks and preview.
 *
 * Features:
 * - 5-step guided flow with progress tracking
 * - Interface selection with filtering
 * - Secure password input (never logged/cached)
 * - MTU/MRU presets for common scenarios
 * - RouterOS command preview before apply
 * - Safety confirmation for default route changes
 * - Error handling and rollback support
 *
 * @example
 * ```tsx
 * <PppoeWizard
 *   routerId="router-123"
 *   onComplete={(result) => console.log('Configured!', result)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * ```
 */
export function PppoeWizard({
  routerId,
  onComplete,
  onCancel,
}: PppoeWizardProps) {
  const [configurePppoeWAN, { loading, error }] = useConfigurePppoeWAN();
  const [configurationResult, setConfigurationResult] = useState<any>(null);

  // Define wizard steps
  const steps: StepConfig[] = [
    {
      id: 'interface',
      title: 'Interface',
      description: 'Select physical interface',
    },
    {
      id: 'credentials',
      title: 'Credentials',
      description: 'ISP username and password',
    },
    {
      id: 'options',
      title: 'Options',
      description: 'Advanced settings',
    },
    {
      id: 'preview',
      title: 'Preview',
      description: 'Review configuration',
    },
    {
      id: 'confirm',
      title: 'Apply',
      description: 'Confirm and apply',
    },
  ];

  // Initialize stepper
  const stepper = useStepper({
    steps,
    initialStep: 0,
  });

  /**
   * Handle final configuration submission
   * Called from the confirm step
   */
  const handleSubmit = async () => {
    try {
      // Collect all data from stepper
      const interfaceData = stepper.getStepData('interface') as Record<string, any> || {};
      const credentialsData = stepper.getStepData('credentials') as Record<string, any> || {};
      const optionsData = stepper.getStepData('options') as Record<string, any> || {};

      const formData: PppoeClientFormValues = {
        name: interfaceData.name || '',
        interface: interfaceData.interface || '',
        username: credentialsData.username || '',
        password: credentialsData.password || '', // NEVER LOG THIS
        serviceName: credentialsData.serviceName,
        mtu: optionsData.mtu,
        mru: optionsData.mru,
        addDefaultRoute: optionsData.addDefaultRoute ?? true,
        usePeerDNS: optionsData.usePeerDNS ?? true,
        comment: optionsData.comment,
      };

      // Execute mutation
      const result = await configurePppoeWAN({
        variables: {
          routerId,
          input: formData,
        },
      });

      if (result.data?.configurePppoeWAN?.success) {
        setConfigurationResult(result.data.configurePppoeWAN);
        if (onComplete) {
          onComplete(result.data.configurePppoeWAN);
        }
      } else {
        // Handle errors from mutation result
        const errors = result.data?.configurePppoeWAN?.errors || [];
        console.error('PPPoE configuration failed:', errors);
      }
    } catch (err) {
      console.error('Failed to configure PPPoE:', err);
    }
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Progress Indicator */}
      <VStepper
        stepper={stepper}
      />

      {/* Step Content */}
      <div className="min-h-[400px]">
        {stepper.currentStep?.id === 'interface' && (
          <PppoeInterfaceStep
            routerId={routerId}
            stepper={stepper}
          />
        )}

        {stepper.currentStep?.id === 'credentials' && (
          <PppoeCredentialsStep stepper={stepper} />
        )}

        {stepper.currentStep?.id === 'options' && (
          <PppoeOptionsStep stepper={stepper} />
        )}

        {stepper.currentStep?.id === 'preview' && (
          <PppoePreviewStep
            routerId={routerId}
            stepper={stepper}
          />
        )}

        {stepper.currentStep?.id === 'confirm' && (
          <PppoeConfirmStep
            stepper={stepper}
            loading={loading}
            error={error}
            result={configurationResult}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div>
          {stepper.currentIndex > 0 && !configurationResult && (
            <Button
              variant="outline"
              onClick={stepper.prev}
              disabled={loading}
            >
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>

          {stepper.currentStep?.id !== 'confirm' && (
            <Button
              onClick={stepper.next}
              disabled={!stepper.canProceed || loading}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-error/10 border border-error p-4">
          <p className="text-sm text-error font-medium">
            Configuration Error
          </p>
          <p className="text-sm text-error/80 mt-1">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
