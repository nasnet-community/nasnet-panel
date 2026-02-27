/**
 * DHCP Wizard - Step 3: Network Settings
 * Configure gateway, DNS servers, lease time, and optional network parameters.
 *
 * @description Guides users through essential and optional DHCP network configuration.
 * Allows flexible DNS server configuration (1-3 servers), gateway selection, lease time,
 * domain name, and NTP server settings. Real-time validation ensures proper IP format
 * and configuration relationships. Field-level help available for each setting.
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useCallback, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { IPInput, FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { networkStepSchema, type NetworkStepFormData, LEASE_TIME_OPTIONS } from './dhcp-wizard.schema';

interface WizardStepNetworkProps {
  /** Stepper instance providing access to wizard step data */
  stepper: UseStepperReturn;
  /** Optional CSS class names to apply to root container */
  className?: string;
}

/**
 * Network settings step component
 */
function WizardStepNetworkComponent({ stepper, className }: WizardStepNetworkProps) {
  const interfaceData = stepper.getStepData('interface') as { interfaceIP?: string };
  const defaultGateway = interfaceData?.interfaceIP?.split('/')[0] || '';

  const form = useForm<NetworkStepFormData>({
    resolver: zodResolver(networkStepSchema) as never,
    defaultValues: (stepper.getStepData('network') as NetworkStepFormData) || {
      gateway: defaultGateway,
      dnsServers: [defaultGateway], // Default to router IP as DNS
      leaseTime: '1d',
      domain: '',
      ntpServer: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dnsServers' as never,
  });

  // Memoized remove handler
  const handleRemoveDNS = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Memoized add handler
  const handleAddDNS = useCallback(() => {
    append('');
  }, [append]);

  // Memoized gateway change handler
  const handleGatewayChange = useCallback((value: string) => {
    form.setValue('gateway', value);
  }, [form]);

  // Memoized DNS field change handler
  const handleDNSChange = useCallback((index: number, value: string) => {
    form.setValue(`dnsServers.${index}`, value);
  }, [form]);

  // Memoized lease time change handler
  const handleLeaseTimeChange = useCallback((value: string) => {
    form.setValue('leaseTime', value as any);
  }, [form]);

  // Memoized NTP server change handler
  const handleNTPChange = useCallback((value: string) => {
    form.setValue('ntpServer', value);
  }, [form]);

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  const canAddDNS = fields.length < 3;
  const MAX_DNS_SERVERS = 3;

  return (
    <div className={cn('space-y-component-lg', className)}>
      <FormSection
        title="Gateway Configuration"
        description="Set the default gateway for DHCP clients"
      >
        <div>
          <Label htmlFor="gateway">
            Default Gateway
            <FieldHelp field="dhcp.gateway" />
          </Label>
          <IPInput
            value={form.watch('gateway') || ''}
            onChange={handleGatewayChange}
            placeholder="e.g., 192.168.1.1"
            id="gateway"
          />
        </div>
      </FormSection>

      <FormSection
        title="DNS Servers"
        description={`Configure DNS servers for DHCP clients (1-${MAX_DNS_SERVERS} servers)`}
      >
        <div className="space-y-component-sm">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-component-sm items-start">
              <div className="flex-1">
                <Label htmlFor={`dns-${index}`}>
                  DNS Server {index + 1}
                </Label>
                <IPInput
                  id={`dns-${index}`}
                  value={form.watch(`dnsServers.${index}`) || ''}
                  onChange={(value: string) => handleDNSChange(index, value)}
                  placeholder="e.g., 8.8.8.8"
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveDNS(index)}
                  className="mt-component-lg"
                  aria-label={`Remove DNS server ${index + 1}`}
                >
                  <Icon icon={Trash2} size="sm" />
                </Button>
              )}
            </div>
          ))}

          {canAddDNS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDNS}
              aria-label={`Add DNS server (${fields.length}/${MAX_DNS_SERVERS})`}
            >
              <Icon icon={Plus} size="sm" />
              <span className="ml-component-sm">Add DNS Server</span>
            </Button>
          )}

          {form.formState.errors.dnsServers && typeof form.formState.errors.dnsServers === 'object' && 'message' in form.formState.errors.dnsServers && (
            <p className="text-sm text-error">
              {form.formState.errors.dnsServers.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Lease Configuration"
        description="Set how long IP addresses are assigned to clients"
      >
        <div>
          <Label htmlFor="lease-time">
            Lease Time
            <FieldHelp field="dhcp.leaseTime" />
          </Label>
          <Select
            value={form.watch('leaseTime')}
            onValueChange={handleLeaseTimeChange}
          >
            <SelectTrigger id="lease-time">
              <SelectValue placeholder="Select lease time" />
            </SelectTrigger>
            <SelectContent>
              {LEASE_TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.leaseTime && (
            <p className="text-sm text-error mt-component-xs">
              {form.formState.errors.leaseTime.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Optional Settings"
        description="Additional network configuration (optional)"
      >
        <div className="space-y-component-md">
          <div>
            <Label htmlFor="domain">
              Domain Name
              <FieldHelp field="dhcp.domain" />
            </Label>
            <Input
              id="domain"
              {...form.register('domain')}
              placeholder="e.g., home.local"
            />
          </div>

          <div>
            <Label htmlFor="ntp-server">
              NTP Server
              <FieldHelp field="dhcp.ntpServer" />
            </Label>
            <IPInput
              id="ntp-server"
              value={form.watch('ntpServer') || ''}
              onChange={handleNTPChange}
              placeholder="e.g., pool.ntp.org or IP address"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}

WizardStepNetworkComponent.displayName = 'WizardStepNetwork';

/**
 * Exported network settings step component
 */
export const WizardStepNetwork = WizardStepNetworkComponent;
