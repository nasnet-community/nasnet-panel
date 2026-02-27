/**
 * DHCP Wizard - Step 4: Review & Create
 * Display comprehensive configuration summary and RouterOS commands before creation.
 *
 * @description Shows a final review of all DHCP settings including interface, pool configuration,
 * network settings, and auto-generated RouterOS commands that will be executed. Provides
 * immediate feedback on the exact changes that will be applied to the router.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useMemo } from 'react';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { ConfigPreview, FormSection } from '@nasnet/ui/patterns';
import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { calculatePoolSize } from '../../utils/pool-calculator';
import type {
  InterfaceStepFormData,
  PoolStepFormData,
  NetworkStepFormData,
} from './dhcp-wizard.schema';

interface WizardStepReviewProps {
  /** Stepper instance providing access to wizard step data */
  stepper: UseStepperReturn;
  /** Optional CSS class names to apply to root container */
  className?: string;
}

/**
 * Review step component - displays configuration summary and RouterOS commands
 */
function WizardStepReviewComponent({ stepper, className }: WizardStepReviewProps) {
  const interfaceData = stepper.getStepData('interface') as InterfaceStepFormData;
  const poolData = stepper.getStepData('pool') as PoolStepFormData;
  const networkData = stepper.getStepData('network') as NetworkStepFormData;

  // Calculate pool size
  const poolSize = useMemo(() => {
    return poolData?.poolStart && poolData?.poolEnd ?
        calculatePoolSize(poolData.poolStart, poolData.poolEnd)
      : 0;
  }, [poolData?.poolStart, poolData?.poolEnd]);

  // Generate RouterOS commands for preview
  const commands = useMemo(
    () => [
      {
        command: `/ip pool add name=pool-dhcp-${interfaceData?.interface || 'default'} ranges=${poolData?.poolStart || ''}-${poolData?.poolEnd || ''}`,
        description: 'Create IP address pool',
      },
      {
        command: `/ip dhcp-server network add address=${interfaceData?.interfaceIP || ''} gateway=${networkData?.gateway || ''} dns-server=${networkData?.dnsServers?.join(',') || ''}${networkData?.domain ? ` domain=${networkData.domain}` : ''}${networkData?.ntpServer ? ` ntp-server=${networkData.ntpServer}` : ''}`,
        description: 'Configure DHCP network settings',
      },
      {
        command: `/ip dhcp-server add name=dhcp-${interfaceData?.interface || 'default'} interface=${interfaceData?.interface || ''} address-pool=pool-dhcp-${interfaceData?.interface || 'default'} lease-time=${networkData?.leaseTime || '1d'} disabled=no`,
        description: 'Create and enable DHCP server',
      },
    ],
    [interfaceData, poolData, networkData]
  );

  return (
    <div className={cn('space-y-component-lg', className)}>
      <FormSection
        title="Review Configuration"
        description="Review your DHCP server settings before creation"
      >
        <div className="gap-component-md grid">
          {/* Interface Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-component-sm">
              <div className="gap-component-sm grid grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Selected Interface:</span>
                  <span className="ml-component-sm font-mono">
                    {interfaceData?.interface || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="ml-component-sm font-mono">
                    {interfaceData?.interfaceIP || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pool Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-component-sm">
              <div className="gap-component-sm grid grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Pool Start:</span>
                  <span className="ml-component-sm font-mono">{poolData?.poolStart || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pool End:</span>
                  <span className="ml-component-sm font-mono">{poolData?.poolEnd || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Total Addresses:</span>
                  <span className="ml-component-sm font-mono">{poolSize}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Network Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-component-sm">
              <div className="gap-component-sm grid grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Gateway:</span>
                  <span className="ml-component-sm font-mono">{networkData?.gateway || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lease Time:</span>
                  <span className="ml-component-sm font-mono">
                    {networkData?.leaseTime || 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">DNS Servers:</span>
                  <span className="ml-component-sm font-mono">
                    {networkData?.dnsServers?.join(', ') || 'N/A'}
                  </span>
                </div>
                {networkData?.domain && (
                  <div>
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="ml-component-sm font-mono">{networkData.domain}</span>
                  </div>
                )}
                {networkData?.ntpServer && (
                  <div>
                    <span className="text-muted-foreground">NTP Server:</span>
                    <span className="ml-component-sm font-mono">{networkData.ntpServer}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </FormSection>

      {/* RouterOS Command Preview */}
      <FormSection
        title="RouterOS Commands"
        description="Commands that will be executed on the router"
      >
        <ConfigPreview script={commands.map((c) => c.command).join('\n')} />
      </FormSection>
    </div>
  );
}

WizardStepReviewComponent.displayName = 'WizardStepReview';

/**
 * Exported review step component with memo optimization
 */
export const WizardStepReview = WizardStepReviewComponent;
