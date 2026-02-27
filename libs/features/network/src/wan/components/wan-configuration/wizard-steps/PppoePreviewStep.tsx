/**
 * PPPoE Wizard - Step 4: Preview Configuration
 * @description Review all PPPoE settings before applying configuration
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useMemo } from 'react';
import { FormSection } from '@nasnet/ui/patterns';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
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
  /** Router ID for context */
  routerId: string;
  /** Stepper hook for wizard navigation and state management */
  stepper: UseStepperReturn;
  /** Optional CSS class override */
  className?: string;
}

/**
 * @description Preview step for PPPoE configuration
 */
export function PppoePreviewStep({ routerId, stepper, className }: PppoePreviewStepProps) {
  const interfaceData = stepper.getStepData<PppoeInterfaceData>('interface');
  const credentialsData = stepper.getStepData<PppoeCredentialsData>('credentials');
  const optionsData = stepper.getStepData<PppoeOptionsData>('options');

  /**
   * Generate RouterOS command preview
   */
  const commandPreview = useMemo(() => {
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
  }, [interfaceData, credentialsData, optionsData]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <FormSection
        title="Review Configuration"
        description="Please review your PPPoE configuration before applying"
      >
        <div className="space-y-component-md">
          {/* Interface Summary */}
          <div className="border-border bg-muted px-component-md py-component-md rounded-[var(--semantic-radius-card)] border">
            <div className="gap-component-sm mb-3 flex items-center">
              <Network
                className="text-primary h-4 w-4"
                aria-hidden="true"
              />
              <h4 className="text-sm font-medium">Interface Configuration</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">PPPoE Interface:</dt>
              <dd className="text-foreground font-mono">{interfaceData?.name || '-'}</dd>
              <dt className="text-muted-foreground">Physical Interface:</dt>
              <dd className="text-foreground font-mono">{interfaceData?.interface || '-'}</dd>
            </dl>
          </div>

          {/* Credentials Summary */}
          <div className="border-border bg-muted px-component-md py-component-md rounded-[var(--semantic-radius-card)] border">
            <div className="gap-component-sm mb-3 flex items-center">
              <User
                className="text-primary h-4 w-4"
                aria-hidden="true"
              />
              <h4 className="text-sm font-medium">ISP Credentials</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Username:</dt>
              <dd className="text-foreground font-mono">{credentialsData?.username || '-'}</dd>
              <dt className="text-muted-foreground">Password:</dt>
              <dd className="text-foreground font-mono">
                {credentialsData?.password ? '••••••••' : '-'}
              </dd>
              {credentialsData?.serviceName && (
                <>
                  <dt className="text-muted-foreground">Service Name:</dt>
                  <dd className="text-foreground font-mono">{credentialsData.serviceName}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Options Summary */}
          <div className="border-border bg-muted px-component-md py-component-md rounded-[var(--semantic-radius-card)] border">
            <div className="gap-component-sm mb-3 flex items-center">
              <Settings
                className="text-primary h-4 w-4"
                aria-hidden="true"
              />
              <h4 className="text-sm font-medium">Advanced Options</h4>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">MTU:</dt>
              <dd className="text-foreground font-mono">{optionsData?.mtu || 1492} bytes</dd>
              <dt className="text-muted-foreground">MRU:</dt>
              <dd className="text-foreground font-mono">{optionsData?.mru || 1492} bytes</dd>
              <dt className="text-muted-foreground">Default Route:</dt>
              <dd>
                {optionsData?.addDefaultRoute ?
                  <span className="text-success">Enabled</span>
                : <span className="text-warning">Disabled</span>}
              </dd>
              <dt className="text-muted-foreground">Use Peer DNS:</dt>
              <dd>
                {optionsData?.usePeerDNS ?
                  <span className="text-success">Enabled</span>
                : <span className="text-muted-foreground">Disabled</span>}
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
        <div className="border-border bg-muted px-component-md py-component-md rounded-[var(--semantic-radius-card)] border">
          <div className="gap-component-sm mb-3 flex items-center">
            <Code
              className="text-primary h-4 w-4"
              aria-hidden="true"
            />
            <h4 className="text-sm font-medium">Command Preview</h4>
          </div>
          <pre className="bg-background px-component-sm py-component-sm border-border overflow-x-auto rounded-[var(--semantic-radius-card)] border font-mono text-xs">
            {commandPreview}
          </pre>
          <p className="text-muted-foreground mt-2 text-xs">
            <strong>Note:</strong> Password is masked for security. The actual password will be
            transmitted securely.
          </p>
        </div>
      </FormSection>
    </div>
  );
}

PppoePreviewStep.displayName = 'PppoePreviewStep';
