/**
 * DHCP Wizard - Step 3: Network Settings
 * Configure gateway, DNS servers, lease time, and optional settings
 *
 * Story: NAS-6.3 - Implement DHCP Server Management
 */

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IPInput } from '@nasnet/ui/patterns';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@nasnet/ui/primitives';
import { Plus, Trash2 } from 'lucide-react';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { networkStepSchema, type NetworkStepFormData, LEASE_TIME_OPTIONS } from './dhcp-wizard.schema';

interface WizardStepNetworkProps {
  stepper: UseStepperReturn;
}

export function WizardStepNetwork({ stepper }: WizardStepNetworkProps) {
  const interfaceData = stepper.getStepData('interface') as { interfaceIP?: string };
  const defaultGateway = interfaceData?.interfaceIP?.split('/')[0] || '';

  const form = useForm<NetworkStepFormData>({
    resolver: zodResolver(networkStepSchema),
    defaultValues: stepper.getStepData('network') || {
      gateway: defaultGateway,
      dnsServers: [defaultGateway], // Default to router IP as DNS
      leaseTime: '1d',
      domain: '',
      ntpServer: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dnsServers',
  });

  // Save form data when proceeding
  useEffect(() => {
    const subscription = form.watch((value) => {
      stepper.setStepData(value);
    });
    return () => subscription.unsubscribe();
  }, [form, stepper]);

  const canAddDNS = fields.length < 3;

  return (
    <div className="space-y-6">
      <FormSection
        title="Gateway Configuration"
        description="Set the default gateway for DHCP clients"
      >
        <div>
          <Label htmlFor="gateway">
            Default Gateway
            <FieldHelp>
              Router IP address that clients will use as their default gateway
            </FieldHelp>
          </Label>
          <IPInput
            id="gateway"
            {...form.register('gateway')}
            error={form.formState.errors.gateway?.message}
            placeholder="e.g., 192.168.1.1"
          />
        </div>
      </FormSection>

      <FormSection
        title="DNS Servers"
        description="Configure DNS servers for DHCP clients (1-3 servers)"
      >
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Label htmlFor={`dns-${index}`}>
                  DNS Server {index + 1}
                </Label>
                <IPInput
                  id={`dns-${index}`}
                  {...form.register(`dnsServers.${index}`)}
                  error={form.formState.errors.dnsServers?.[index]?.message}
                  placeholder="e.g., 8.8.8.8"
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mt-8"
                  aria-label={`Remove DNS server ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {canAddDNS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append('')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add DNS Server
            </Button>
          )}

          {form.formState.errors.dnsServers && typeof form.formState.errors.dnsServers === 'object' && 'message' in form.formState.errors.dnsServers && (
            <p className="text-sm text-destructive">
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
            <FieldHelp>
              How long clients can use an IP address before renewal
            </FieldHelp>
          </Label>
          <Select
            value={form.watch('leaseTime')}
            onValueChange={(value) => form.setValue('leaseTime', value as any)}
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
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.leaseTime.message}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Optional Settings"
        description="Additional network configuration (optional)"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="domain">
              Domain Name
              <FieldHelp>
                DNS search domain for clients (e.g., home.local)
              </FieldHelp>
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
              <FieldHelp>
                Time server IP address for client time synchronization
              </FieldHelp>
            </Label>
            <IPInput
              id="ntp-server"
              {...form.register('ntpServer')}
              error={form.formState.errors.ntpServer?.message}
              placeholder="e.g., pool.ntp.org or IP address"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
