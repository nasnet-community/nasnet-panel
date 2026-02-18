/**
 * DHCP Wizard - Step 4: Review & Create
 * Display summary and RouterOS command preview before creation
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { ConfigPreview, FormSection } from '@nasnet/ui/patterns';
import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { calculatePoolSize } from '../../utils/pool-calculator';
import type { InterfaceStepFormData, PoolStepFormData, NetworkStepFormData } from './dhcp-wizard.schema';

interface WizardStepReviewProps {
  stepper: UseStepperReturn;
}

export function WizardStepReview({ stepper }: WizardStepReviewProps) {
  const interfaceData = stepper.getStepData('interface') as InterfaceStepFormData;
  const poolData = stepper.getStepData('pool') as PoolStepFormData;
  const networkData = stepper.getStepData('network') as NetworkStepFormData;

  // Calculate pool size
  const poolSize = poolData?.poolStart && poolData?.poolEnd
    ? calculatePoolSize(poolData.poolStart, poolData.poolEnd)
    : 0;

  // Generate RouterOS commands for preview
  const commands = [
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
  ];

  return (
    <div className="space-y-6">
      <FormSection
        title="Review Configuration"
        description="Review your DHCP server settings before creation"
      >
        <div className="grid gap-4">
          {/* Interface Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Selected Interface:</span>
                  <span className="ml-2 font-mono">{interfaceData?.interface || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="ml-2 font-mono">{interfaceData?.interfaceIP || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pool Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address Pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Pool Start:</span>
                  <span className="ml-2 font-mono">{poolData?.poolStart || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pool End:</span>
                  <span className="ml-2 font-mono">{poolData?.poolEnd || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Total Addresses:</span>
                  <span className="ml-2 font-mono">{poolSize}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Network Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Gateway:</span>
                  <span className="ml-2 font-mono">{networkData?.gateway || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lease Time:</span>
                  <span className="ml-2 font-mono">{networkData?.leaseTime || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">DNS Servers:</span>
                  <span className="ml-2 font-mono">
                    {networkData?.dnsServers?.join(', ') || 'N/A'}
                  </span>
                </div>
                {networkData?.domain && (
                  <div>
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="ml-2 font-mono">{networkData.domain}</span>
                  </div>
                )}
                {networkData?.ntpServer && (
                  <div>
                    <span className="text-muted-foreground">NTP Server:</span>
                    <span className="ml-2 font-mono">{networkData.ntpServer}</span>
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
