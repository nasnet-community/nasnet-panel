/**
 * Static IP WAN Configuration Form Component
 *
 * Form for configuring WAN interface with static IP including:
 * - Physical interface selection
 * - IP address in CIDR notation
 * - Gateway configuration with reachability validation
 * - DNS servers (optional)
 * - IP conflict detection
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 4: Static IP)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Input,
  Label,
  Button,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@nasnet/ui/primitives';
import { FormSection, FieldHelp, InterfaceSelector } from '@nasnet/ui/patterns';
import type { Interface } from '@nasnet/core/types';
import {
  staticIPSchema,
  staticIPDefaultValues,
  type StaticIPFormValues,
  DNS_PRESETS,
  SUBNET_PRESETS,
} from '../../schemas/static-ip.schema';
import { AlertTriangle, Network, Globe, Server } from 'lucide-react';

/**
 * Static IP Form Props
 */
export interface StaticIPFormProps {
  /** Router ID for interface selection */
  routerId: string;
  /** Initial form values (optional, uses defaults if not provided) */
  initialValues?: Partial<StaticIPFormValues>;
  /** Callback when form is submitted */
  onSubmit: (values: StaticIPFormValues) => void | Promise<void>;
  /** Whether submit operation is in progress */
  loading?: boolean;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

/**
 * Static IP WAN Configuration Form
 *
 * Manages static IP WAN configuration with validation and safety warnings.
 *
 * Features:
 * - Interface selection with type filtering (only Ethernet interfaces)
 * - IP address input with CIDR notation validation
 * - Gateway reachability validation (subnet check)
 * - DNS server presets (Cloudflare, Google, Quad9, OpenDNS)
 * - Subnet mask presets for common scenarios
 * - Safety confirmation for potential connectivity loss
 * - Optional comment field (max 255 chars)
 *
 * Safety Pipeline Integration:
 * - Preview commands before apply (handled by parent)
 * - Confirm changes via AlertDialog
 * - Shows warning when changing default route
 *
 * @example
 * ```tsx
 * <StaticIPForm
 *   routerId="router-123"
 *   onSubmit={handleSubmit}
 *   loading={isSubmitting}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function StaticIPForm({
  routerId,
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
}: StaticIPFormProps) {
  const [selectedInterface, setSelectedInterface] = useState<Interface | null>(
    null
  );
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [pendingFormValues, setPendingFormValues] =
    useState<StaticIPFormValues | null>(null);

  const form = useForm<StaticIPFormValues>({
    resolver: zodResolver(staticIPSchema),
    defaultValues: {
      ...staticIPDefaultValues,
      ...initialValues,
    },
  });

  /**
   * Handle interface selection
   */
  const handleInterfaceSelect = (iface: Interface) => {
    setSelectedInterface(iface);
    form.setValue('interface', iface.name, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /**
   * Apply DNS preset
   */
  const applyDNSPreset = (preset: keyof typeof DNS_PRESETS) => {
    const { primary, secondary } = DNS_PRESETS[preset];
    form.setValue('primaryDNS', primary, { shouldDirty: true });
    form.setValue('secondaryDNS', secondary, { shouldDirty: true });
  };

  /**
   * Apply subnet mask preset to current IP
   */
  const applySubnetPreset = (mask: string) => {
    const currentAddress = form.watch('address');
    if (currentAddress) {
      // Extract IP part (before /) and replace mask
      const ip = currentAddress.split('/')[0];
      form.setValue('address', `${ip}${mask}`, { shouldDirty: true });
    }
  };

  /**
   * Handle form submission with safety checks
   */
  const handleFormSubmit = (values: StaticIPFormValues) => {
    // Show safety warning before applying
    setPendingFormValues(values);
    setShowSafetyWarning(true);
  };

  /**
   * Confirm safety warning and proceed with submission
   */
  const handleConfirmSafety = () => {
    if (pendingFormValues) {
      onSubmit(pendingFormValues);
    }
    setShowSafetyWarning(false);
    setPendingFormValues(null);
  };

  /**
   * Cancel safety warning
   */
  const handleCancelSafety = () => {
    setShowSafetyWarning(false);
    setPendingFormValues(null);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Interface Selection */}
        <FormSection
          title="Interface Configuration"
          description="Select the physical interface for static IP WAN connection"
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="interface-selector">
                  <Network className="inline h-4 w-4 mr-1" />
                  Physical Interface
                </Label>
                <FieldHelp
                  field="interface"
                  text="Select an Ethernet interface connected to your ISP or upstream router."
                />
              </div>
              <InterfaceSelector
                id="interface-selector"
                routerId={routerId}
                onSelect={handleInterfaceSelect}
                selectedInterface={selectedInterface}
                filter={(iface) =>
                  iface.type === 'ether' || iface.name.startsWith('ether')
                }
                disabled={loading}
              />
              {form.formState.errors.interface && (
                <p
                  className="text-sm text-error mt-1"
                  role="alert"
                  id="interface-error"
                >
                  {form.formState.errors.interface.message}
                </p>
              )}
            </div>

            {selectedInterface && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h4 className="font-medium text-sm">
                  Selected Interface Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-mono">{selectedInterface.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{selectedInterface.type}</span>
                  </div>
                  {selectedInterface.macAddress && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">MAC:</span>
                      <span className="ml-2 font-mono">
                        {selectedInterface.macAddress}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* IP Configuration */}
        <FormSection
          title="IP Address Configuration"
          description="Configure static IP address and gateway"
        >
          <div className="space-y-4">
            {/* IP Address with Subnet Mask */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="address">
                  <Globe className="inline h-4 w-4 mr-1" />
                  IP Address (CIDR)
                </Label>
                <FieldHelp
                  field="address"
                  text="IP address in CIDR notation (e.g., 203.0.113.10/30). Include the subnet mask."
                />
              </div>
              <Input
                id="address"
                type="text"
                placeholder="203.0.113.10/30"
                {...form.register('address')}
                aria-describedby="address-error address-help"
                disabled={loading}
              />
              {form.formState.errors.address && (
                <p id="address-error" className="text-sm text-error mt-1" role="alert">
                  {form.formState.errors.address.message}
                </p>
              )}
              <p id="address-help" className="text-xs text-muted-foreground mt-1">
                Format: IP/MASK (e.g., 203.0.113.10/30 for point-to-point)
              </p>

              {/* Subnet Mask Presets */}
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground mb-1">
                  Quick Subnet Presets:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SUBNET_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySubnetPreset(preset.mask)}
                      disabled={loading}
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gateway */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="gateway">Gateway</Label>
                <FieldHelp
                  field="gateway"
                  text="Gateway IP address. Must be reachable from the configured IP address (same subnet)."
                />
              </div>
              <Input
                id="gateway"
                type="text"
                placeholder="203.0.113.9"
                {...form.register('gateway')}
                aria-describedby="gateway-error gateway-help"
                disabled={loading}
              />
              {form.formState.errors.gateway && (
                <p id="gateway-error" className="text-sm text-error mt-1" role="alert">
                  {form.formState.errors.gateway.message}
                </p>
              )}
              <p id="gateway-help" className="text-xs text-muted-foreground mt-1">
                IPv4 address of the upstream router or ISP gateway
              </p>
            </div>
          </div>
        </FormSection>

        {/* DNS Configuration */}
        <FormSection
          title="DNS Servers"
          description="Configure DNS servers (optional but recommended)"
        >
          <div className="space-y-4">
            {/* DNS Presets */}
            <div>
              <Label className="mb-2">Quick DNS Presets:</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DNS_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDNSPreset(key as keyof typeof DNS_PRESETS)}
                    disabled={loading}
                  >
                    <Server className="h-4 w-4 mr-2" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Primary DNS */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="primary-dns">Primary DNS</Label>
                <FieldHelp
                  field="primaryDNS"
                  text="Primary DNS server (e.g., 1.1.1.1 for Cloudflare, 8.8.8.8 for Google)."
                />
              </div>
              <Input
                id="primary-dns"
                type="text"
                placeholder="1.1.1.1"
                {...form.register('primaryDNS')}
                aria-describedby="primary-dns-error"
                disabled={loading}
              />
              {form.formState.errors.primaryDNS && (
                <p
                  id="primary-dns-error"
                  className="text-sm text-error mt-1"
                  role="alert"
                >
                  {form.formState.errors.primaryDNS.message}
                </p>
              )}
            </div>

            {/* Secondary DNS */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="secondary-dns">Secondary DNS (Optional)</Label>
                <FieldHelp
                  field="secondaryDNS"
                  text="Backup DNS server for redundancy."
                />
              </div>
              <Input
                id="secondary-dns"
                type="text"
                placeholder="1.0.0.1"
                {...form.register('secondaryDNS')}
                aria-describedby="secondary-dns-error"
                disabled={loading}
              />
              {form.formState.errors.secondaryDNS && (
                <p
                  id="secondary-dns-error"
                  className="text-sm text-error mt-1"
                  role="alert"
                >
                  {form.formState.errors.secondaryDNS.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Optional Comment */}
        <FormSection
          title="Identification"
          description="Optional comment for this configuration"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="comment">Comment</Label>
              <FieldHelp
                field="comment"
                text="Optional description for this static IP configuration (max 255 characters)."
              />
            </div>
            <Input
              id="comment"
              type="text"
              maxLength={255}
              placeholder="e.g., Static WAN from ISP"
              disabled={loading}
              {...form.register('comment')}
              aria-describedby="comment-error comment-help"
            />
            {form.formState.errors.comment && (
              <p id="comment-error" className="text-sm text-error" role="alert">
                {form.formState.errors.comment.message}
              </p>
            )}
            <p id="comment-help" className="text-xs text-muted-foreground">
              {form.watch('comment')?.length || 0}/255 characters
            </p>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !form.formState.isValid || !form.formState.isDirty}
            className="min-w-[120px]"
          >
            {loading ? 'Configuring...' : 'Configure Static IP'}
          </Button>
        </div>
      </form>

      {/* Safety Warning Dialog */}
      <AlertDialog
        open={showSafetyWarning}
        onOpenChange={setShowSafetyWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Static IP Configuration Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to configure a <strong>static IP</strong> on this
                interface and add a <strong>default route</strong>.
              </p>
              <p className="text-sm">
                <strong>Warning:</strong> This will replace any existing default
                route and may temporarily interrupt your internet connection during
                configuration.
              </p>
              <p className="text-sm text-muted-foreground">
                Ensure the IP address and gateway are correct. Incorrect
                configuration may result in loss of connectivity.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSafety}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSafety}
              className="bg-warning hover:bg-warning/90"
            >
              I Understand, Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
