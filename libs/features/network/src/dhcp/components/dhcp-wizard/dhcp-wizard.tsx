/**
 * DHCP Wizard - Main Orchestrator
 * Multi-step wizard for creating DHCP servers using CStepper component.
 * Guides users through interface selection, pool configuration, network settings, and review.
 *
 * @description Provides a guided workflow for DHCP server creation with live preview
 * of configuration across all steps. Maintains internal state for each step and
 * offers navigation between steps with validation at each stage.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CStepper } from '@nasnet/ui/patterns';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { useConnectionStore } from '@nasnet/state/stores';
import { cn } from '@nasnet/ui/utils';
import { useDHCPWizard } from './use-dhcp-wizard';
import { WizardStepInterface } from './wizard-step-interface';
import { WizardStepPool } from './wizard-step-pool';
import { WizardStepNetwork } from './wizard-step-network';
import { WizardStepReview } from './wizard-step-review';
import type { InterfaceStepFormData, PoolStepFormData, NetworkStepFormData } from './dhcp-wizard.schema';

interface DHCPWizardProps {
  /** Optional CSS class names to apply to root container */
  className?: string;
}

/**
 * DHCP Wizard component - orchestrates multi-step wizard flow
 */
function DHCPWizardComponent({ className }: DHCPWizardProps) {
  const navigate = useNavigate();
  const routerIp = useConnectionStore((state) => state.currentRouterIp);
  const { stepper, isCreating } = useDHCPWizard();

  // Memoized step content renderer
  const stepContent = useMemo(() => {
    switch (stepper.currentStep.id) {
      case 'interface':
        return <WizardStepInterface stepper={stepper} routerIp={routerIp || ''} />;
      case 'pool':
        return <WizardStepPool stepper={stepper} />;
      case 'network':
        return <WizardStepNetwork stepper={stepper} />;
      case 'review':
        return <WizardStepReview stepper={stepper} />;
      default:
        return null;
    }
  }, [stepper, routerIp]);

  // Memoized live preview renderer
  const previewContent = useMemo(() => {
    const interfaceData = stepper.getStepData('interface') as InterfaceStepFormData;
    const poolData = stepper.getStepData('pool') as PoolStepFormData;
    const networkData = stepper.getStepData('network') as NetworkStepFormData;

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>DHCP server configuration summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Interface Preview */}
          {interfaceData?.interface && (
            <div>
              <h4 className="text-sm font-medium mb-2">Interface</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-mono">{interfaceData.interface}</span>
                </div>
                {interfaceData.interfaceIP && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono">{interfaceData.interfaceIP}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pool Preview */}
          {poolData?.poolStart && poolData?.poolEnd && (
            <div>
              <h4 className="text-sm font-medium mb-2">Address Pool</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-mono">{poolData.poolStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-mono">{poolData.poolEnd}</span>
                </div>
              </div>
            </div>
          )}

          {/* Network Preview */}
          {networkData?.gateway && (
            <div>
              <h4 className="text-sm font-medium mb-2">Network Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway:</span>
                  <span className="font-mono">{networkData.gateway}</span>
                </div>
                {networkData.dnsServers && networkData.dnsServers.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DNS:</span>
                    <span className="font-mono">{networkData.dnsServers.join(', ')}</span>
                  </div>
                )}
                {networkData.leaseTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Time:</span>
                    <span className="font-mono">{networkData.leaseTime}</span>
                  </div>
                )}
                {networkData.domain && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-mono">{networkData.domain}</span>
                  </div>
                )}
                {networkData.ntpServer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NTP:</span>
                    <span className="font-mono">{networkData.ntpServer}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder when no data */}
          {!interfaceData?.interface && !poolData?.poolStart && !networkData?.gateway && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Complete the wizard steps to see a live preview of your DHCP server configuration.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [stepper]);

  // Memoized completion handler
  const handleComplete = useCallback(async () => {
    await stepper.next();
    // On success, navigate to DHCP server list
    navigate({ to: '/network/dhcp' });
  }, [stepper, navigate]);

  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    navigate({ to: '/network/dhcp' });
  }, [navigate]);

  return (
    <div className={cn('container mx-auto py-6', className)}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create DHCP Server</h1>
        <p className="text-muted-foreground mt-2">
          Configure a new DHCP server to automatically assign IP addresses to devices on your network.
        </p>
      </div>

      <CStepper
        stepper={stepper}
        stepContent={stepContent}
        previewContent={previewContent}
        customNavigation={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
              aria-label="Cancel wizard"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={stepper.prev}
              disabled={stepper.currentIndex === 0 || isCreating}
              aria-label="Go to previous step"
            >
              Previous
            </Button>
            {stepper.currentIndex < stepper.steps.length - 1 ? (
              <Button
                onClick={() => stepper.next()}
                disabled={isCreating}
                aria-label="Go to next step"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCreating}
                aria-label="Complete DHCP server creation"
              >
                {isCreating ? 'Creating...' : 'Create DHCP Server'}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}

DHCPWizardComponent.displayName = 'DHCPWizard';

/**
 * Exported DHCP Wizard component with memo optimization
 */
export const DHCPWizard = Object.assign(DHCPWizardComponent, {
  displayName: 'DHCPWizard',
});
