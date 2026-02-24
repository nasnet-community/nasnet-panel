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

import { useState, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@nasnet/ui/utils';
import {
  Input,
  Label,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives';
import { FormSection, FieldHelp, InterfaceSelector } from '@nasnet/ui/patterns';
import type { RouterInterface } from '@nasnet/ui/patterns';
import {
  staticIPSchema,
  STATIC_IP_DEFAULT_VALUES,
  type StaticIPFormValues,
  DNS_PRESETS,
  SUBNET_PRESETS,
} from '../../schemas/static-ip.schema';
import { AlertTriangle, Network, Globe, Server } from 'lucide-react';

/**
 * Static IP Form Props
 * @description Configuration options for the Static IP WAN form
 */
export interface StaticIPFormProps {
  /** Router ID for interface selection */
  routerId: string;
  /** Initial form values (optional, uses defaults if not provided) */
  initialValues?: Partial<StaticIPFormValues>;
  /** Callback when form is submitted */
  onSubmit: (values: StaticIPFormValues) => void | Promise<void>;
  /** Whether submit operation is in progress */
  isLoading?: boolean;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Optional CSS class name */
  className?: string;
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
 *   isLoading={isSubmitting}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const StaticIPForm = memo(function StaticIPForm({
  routerId,
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
  className,
}: StaticIPFormProps) {
  const [selectedInterface, setSelectedInterface] = useState<RouterInterface | null>(
    null
  );
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [pendingFormValues, setPendingFormValues] =
    useState<StaticIPFormValues | null>(null);

  const form = useForm<StaticIPFormValues>({
    resolver: zodResolver(staticIPSchema) as any,
    defaultValues: {
      ...STATIC_IP_DEFAULT_VALUES,
      ...initialValues,
    },
  });

  /**
   * Handle interface selection
   */
  const handleInterfaceSelect = useCallback((interfaceId: string | string[]) => {
    // InterfaceSelector onChange returns the ID
    const selectedId = Array.isArray(interfaceId) ? interfaceId[0] : interfaceId;
    form.setValue('interface', selectedId, {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Create a minimal interface object for display
    setSelectedInterface({
      id: selectedId,
      name: selectedId,
      type: 'ethernet',
      status: 'up',
      mac: '',
    } as RouterInterface);
  }, [form]);

  /**
   * Apply DNS preset
   */
  const applyDNSPreset = useCallback((preset: keyof typeof DNS_PRESETS) => {
    const { primary, secondary } = DNS_PRESETS[preset];
    form.setValue('primaryDNS', primary, { shouldDirty: true });
    form.setValue('secondaryDNS', secondary, { shouldDirty: true });
  }, [form]);

  /**
   * Apply subnet mask preset to current IP
   */
  const applySubnetPreset = useCallback((mask: string) => {
    const currentAddress = form.watch('address');
    if (currentAddress) {
      // Extract IP part (before /) and replace mask
      const ip = currentAddress.split('/')[0];
      form.setValue('address', `${ip}${mask}`, { shouldDirty: true });
    }
  }, [form]);

  /**
   * Handle form submission with safety checks
   */
  const handleFormSubmit = useCallback((values: StaticIPFormValues) => {
    // Show safety warning before applying
    setPendingFormValues(values);
    setShowSafetyWarning(true);
  }, []);

  /**
   * Confirm safety warning and proceed with submission
   */
  const handleConfirmSafety = useCallback(() => {
    if (pendingFormValues) {
      onSubmit(pendingFormValues);
    }
    setShowSafetyWarning(false);
    setPendingFormValues(null);
  }, [pendingFormValues, onSubmit]);

  /**
   * Cancel safety warning
   */
  const handleCancelSafety = useCallback(() => {
    setShowSafetyWarning(false);
    setPendingFormValues(null);
  }, []);

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className={cn('space-y-component-lg', className)}>
        {/* Interface Selection */}
        <FormSection
          title="Interface Configuration"
          description="Select the physical interface for static IP WAN connection"
        >
          <div className="space-y-component-md">
            <div>
              <div className="flex items-center gap-component-md mb-component-md">
                <Label htmlFor="interface-selector">
                  <Network className="inline h-4 w-4 mr-1" />
                  Physical Interface
                </Label>
                <FieldHelp field="interface" />
              </div>
              <InterfaceSelector
                id="interface-selector"
                routerId={routerId}
                onChange={handleInterfaceSelect}
                value={selectedInterface?.id}
                types={['ethernet']}
                disabled={isLoading}
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
              <div className="rounded-card-sm border border-border bg-muted/50 p-component-md space-y-component-sm">
                <h4 className="font-medium text-sm">
                  Selected Interface Details
                </h4>
                <div className="grid grid-cols-2 gap-component-sm text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-mono text-xs">{selectedInterface.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{selectedInterface.type}</span>
                  </div>
                  {selectedInterface.mac && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">MAC:</span>
                      <span className="ml-2 font-mono text-xs">
                        {selectedInterface.mac}
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
          <div className="space-y-component-md">
            {/* IP Address with Subnet Mask */}
            <div>
              <div className="flex items-center gap-component-md mb-component-md">
                <Label htmlFor="address">
                  <Globe className="inline h-4 w-4 mr-1" />
                  IP Address (CIDR)
                </Label>
                <FieldHelp field="address" />
              </div>
              <Input
                id="address"
                type="text"
                placeholder="203.0.113.10/30"
                {...form.register('address')}
                aria-describedby="address-error address-help"
                disabled={isLoading}
                className="font-mono text-sm"
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
              <div className="mt-component-md">
                <Label className="text-xs text-muted-foreground mb-1">
                  Quick Subnet Presets:
                </Label>
                <div className="flex flex-wrap gap-component-md">
                  {Object.entries(SUBNET_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applySubnetPreset(preset.mask)}
                      disabled={isLoading}
                      className="text-xs"
                      aria-label={`Set subnet mask to ${preset.label}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gateway */}
            <div>
              <div className="flex items-center gap-component-md mb-component-md">
                <Label htmlFor="gateway">Gateway</Label>
                <FieldHelp field="gateway" />
              </div>
              <Input
                id="gateway"
                type="text"
                placeholder="203.0.113.9"
                {...form.register('gateway')}
                aria-describedby="gateway-error gateway-help"
                disabled={isLoading}
                className="font-mono text-sm"
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
          <div className="space-y-component-md">
            {/* DNS Presets */}
            <div>
              <Label className="mb-component-md">Quick DNS Presets:</Label>
              <div className="grid grid-cols-2 gap-component-md">
                {Object.entries(DNS_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDNSPreset(key as keyof typeof DNS_PRESETS)}
                    disabled={isLoading}
                    aria-label={`Apply ${preset.label} DNS servers`}
                  >
                    <Server className="h-4 w-4 mr-2" aria-hidden="true" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Primary DNS */}
            <div>
              <div className="flex items-center gap-component-md mb-component-md">
                <Label htmlFor="primary-dns">Primary DNS</Label>
                <FieldHelp field="primaryDNS" />
              </div>
              <Input
                id="primary-dns"
                type="text"
                placeholder="1.1.1.1"
                {...form.register('primaryDNS')}
                aria-describedby="primary-dns-error"
                disabled={isLoading}
                className="font-mono text-sm"
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
              <div className="flex items-center gap-component-md mb-component-md">
                <Label htmlFor="secondary-dns">Secondary DNS (Optional)</Label>
                <FieldHelp field="secondaryDNS" />
              </div>
              <Input
                id="secondary-dns"
                type="text"
                placeholder="1.0.0.1"
                {...form.register('secondaryDNS')}
                aria-describedby="secondary-dns-error"
                disabled={isLoading}
                className="font-mono text-sm"
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
          <div className="space-y-component-md">
            <div className="flex items-center gap-component-md">
              <Label htmlFor="comment">Comment</Label>
              <FieldHelp field="comment" />
            </div>
            <Input
              id="comment"
              type="text"
              maxLength={255}
              placeholder="e.g., Static WAN from ISP"
              disabled={isLoading}
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
        <div className="flex gap-component-md justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              aria-label="Cancel static IP configuration"
              className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || !form.formState.isValid || !form.formState.isDirty}
            className="min-w-[120px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-busy={isLoading}
          >
            {isLoading ? 'Configuring...' : 'Configure Static IP'}
          </Button>
        </div>
      </form>

      {/* Safety Warning Dialog */}
      <Dialog
        open={showSafetyWarning}
        onOpenChange={setShowSafetyWarning}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-component-md">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              Static IP Configuration Warning
            </DialogTitle>
            <DialogDescription className="space-y-component-md">
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
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-component-md">
            <Button
              variant="outline"
              onClick={handleCancelSafety}
              className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Cancel and go back"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSafety}
              className="min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Understand the warning and proceed"
            >
              I Understand, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

StaticIPForm.displayName = 'StaticIPForm';
