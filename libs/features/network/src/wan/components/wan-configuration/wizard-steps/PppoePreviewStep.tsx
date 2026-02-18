/**
 * PPPoE Wizard - Step 4: Preview Configuration
 *
 * Review all settings before applying.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { FormSection } from '@nasnet/ui/patterns';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { Code, Network, User, Settings } from 'lucide-react';

interface PppoeInterfaceData {
  name?: string;
  interface?: string;
}

interface PppoeCredentialsData {
  username?: string;
  password?: string;
  serviceName?: string;
}

interface PppoeOptionsData {
  mtu?: number;
  mru?: number;
  addDefaultRoute?: boolean;
  usePeerDNS?: boolean;
  comment?: string;
}

interface PppoePreviewStepProps {
  routerId: string;
  stepper: UseStepperReturn;
}

export function PppoePreviewStep({
  routerId,
  stepper,
}: PppoePreviewStepProps) {
  const interfaceData = stepper.getStepData<PppoeInterfaceData>('interface');
  const credentialsData = stepper.getStepData<PppoeCredentialsData>('credentials');
  const optionsData = stepper.getStepData<PppoeOptionsData>('options');

  /**
   * Generate RouterOS command preview
   */
  const generateCommandPreview = () => {
    const commands = [];

    // Main PPPoE client add command
    const addCmd = `/interface/pppoe-client/add \\
  name=${interfaceData?.name || 'pppoe-wan'} \\
  interface=${interfaceData?.interface || 'ether1'} \\
  user=${credentialsData?.username || 'username'} \\
  password=*** \\
  ${credentialsData?.serviceName ? `service-name=${credentialsData.serviceName} \\` : ''}
  ${optionsData?.mtu ? `mtu=${optionsData.mtu} \\` : ''}
  ${optionsData?.mru ? `mru=${optionsData.mru} \\` : ''}
  add-default-route=${optionsData?.addDefaultRoute ? 'yes' : 'no'} \\
  use-peer-dns=${optionsData?.usePeerDNS ? 'yes' : 'no'} \\
  ${optionsData?.comment ? `comment="${optionsData.comment}" \\` : ''}
  disabled=no`;

    commands.push(addCmd);

    return commands.join('\n\n');
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Review Configuration"
        description="Please review your PPPoE configuration before applying"
      >
        <div className="space-y-4">
          {/* Interface Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Interface Configuration</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">PPPoE Interface:</dt>
              <dd className="font-mono">{interfaceData?.name || '-'}</dd>
              <dt className="text-muted-foreground">Physical Interface:</dt>
              <dd className="font-mono">{interfaceData?.interface || '-'}</dd>
            </dl>
          </div>

          {/* Credentials Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">ISP Credentials</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Username:</dt>
              <dd className="font-mono">{credentialsData?.username || '-'}</dd>
              <dt className="text-muted-foreground">Password:</dt>
              <dd className="font-mono">
                {credentialsData?.password ? '••••••••' : '-'}
              </dd>
              {credentialsData?.serviceName && (
                <>
                  <dt className="text-muted-foreground">Service Name:</dt>
                  <dd className="font-mono">{credentialsData.serviceName}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Options Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Advanced Options</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">MTU:</dt>
              <dd>{optionsData?.mtu || 1492} bytes</dd>
              <dt className="text-muted-foreground">MRU:</dt>
              <dd>{optionsData?.mru || 1492} bytes</dd>
              <dt className="text-muted-foreground">Default Route:</dt>
              <dd>
                {optionsData?.addDefaultRoute ? (
                  <span className="text-success">Enabled</span>
                ) : (
                  <span className="text-warning">Disabled</span>
                )}
              </dd>
              <dt className="text-muted-foreground">Use Peer DNS:</dt>
              <dd>
                {optionsData?.usePeerDNS ? (
                  <span className="text-success">Enabled</span>
                ) : (
                  <span className="text-muted-foreground">Disabled</span>
                )}
              </dd>
              {optionsData?.comment && (
                <>
                  <dt className="text-muted-foreground">Comment:</dt>
                  <dd className="col-span-1">{optionsData.comment}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </FormSection>

      {/* RouterOS Command Preview */}
      <FormSection
        title="RouterOS Commands"
        description="The following commands will be executed on the router"
      >
        <div className="rounded-lg border bg-muted p-4">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Command Preview</h4>
          </div>
          <pre className="text-xs font-mono overflow-x-auto bg-background p-3 rounded border">
            {generateCommandPreview()}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Note:</strong> Password is masked for security. The actual
            password will be transmitted securely.
          </p>
        </div>
      </FormSection>
    </div>
  );
}
