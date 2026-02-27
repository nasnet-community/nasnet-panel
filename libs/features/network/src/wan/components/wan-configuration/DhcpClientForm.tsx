/**
 * DHCP Client Configuration Form Component
 *
 * Form for configuring WAN interface as DHCP client including:
 * - Physical interface selection
 * - Default route configuration
 * - DNS and NTP peer settings
 * - Optional comment
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 2: DHCP)
 *
 * @description Manages DHCP WAN client configuration with validation and safety warnings.
 * Includes interface selection, default route toggle, DNS/NTP settings, and optional comments.
 */

import { useState, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Switch,
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
import { cn } from '@nasnet/ui/utils';
import type { RouterInterface } from '@nasnet/ui/patterns';
import {
  dhcpClientSchema,
  DHCP_CLIENT_DEFAULT_VALUES,
  type DhcpClientFormValues,
} from '../../schemas/dhcp-client.schema';
import { AlertTriangle, Network } from 'lucide-react';

/**
 * DHCP Client Form Props
 */
export interface DhcpClientFormProps {
  /** Router ID for interface selection */
  routerId: string;
  /** Initial form values (optional, uses defaults if not provided) */
  initialValues?: Partial<DhcpClientFormValues>;
  /** Callback when form is submitted */
  onSubmit: (values: DhcpClientFormValues) => void | Promise<void>;
  /** Whether submit operation is in progress */
  loading?: boolean;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

/**
 * DHCP Client Configuration Form
 *
 * Manages DHCP WAN client configuration with validation and safety warnings.
 *
 * Features:
 * - Interface selection with type filtering (only Ethernet interfaces)
 * - Default route toggle with warning for existing routes
 * - DNS/NTP peer settings
 * - Optional comment field (max 255 chars)
 * - Safety confirmation for default route changes
 * - Contextual help tooltips
 *
 * Safety Pipeline Integration:
 * - Preview commands before apply (handled by parent)
 * - Confirm changes via AlertDialog
 * - Shows warning when changing default route
 *
 * @example
 * ```tsx
 * <DhcpClientForm
 *   routerId="router-123"
 *   onSubmit={handleSubmit}
 *   loading={isSubmitting}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const DhcpClientForm = memo(function DhcpClientForm({
  routerId,
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
}: DhcpClientFormProps) {
  const [selectedInterface, setSelectedInterface] = useState<RouterInterface | null>(null);
  const [showDefaultRouteWarning, setShowDefaultRouteWarning] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState<DhcpClientFormValues | null>(null);

  const form = useForm<DhcpClientFormValues>({
    resolver: zodResolver(dhcpClientSchema) as any,
    defaultValues: {
      ...DHCP_CLIENT_DEFAULT_VALUES,
      ...initialValues,
    },
  });

  /**
   * Handle interface selection
   * Updates form value and stores interface object
   */
  const handleInterfaceSelect = useCallback(
    (interfaceId: string | string[]) => {
      // InterfaceSelector onChange returns the ID, need to find the interface
      // For now, just update the form field with the ID
      const selectedId = Array.isArray(interfaceId) ? interfaceId[0] : interfaceId;
      form.setValue('interface', selectedId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      // In a real scenario, would fetch the full interface object
      // For demo purposes, create a minimal interface object
      setSelectedInterface({
        id: selectedId,
        name: selectedId,
        type: 'ethernet',
        status: 'up',
        mac: '',
      } as RouterInterface);
    },
    [form]
  );

  /**
   * Handle form submission with safety checks
   * Shows warning if adding default route that might conflict
   */
  const handleFormSubmit = useCallback(
    (values: DhcpClientFormValues) => {
      // Check if we're adding a default route
      if (values.shouldAddDefaultRoute) {
        // TODO: In Phase 6, check for existing default routes
        // For now, show warning to user
        setPendingFormValues(values);
        setShowDefaultRouteWarning(true);
      } else {
        // No default route, submit directly
        onSubmit(values);
      }
    },
    [onSubmit]
  );

  /**
   * Confirm default route warning and proceed with submission
   */
  const handleConfirmDefaultRoute = useCallback(() => {
    if (pendingFormValues) {
      onSubmit(pendingFormValues);
    }
    setShowDefaultRouteWarning(false);
    setPendingFormValues(null);
  }, [pendingFormValues, onSubmit]);

  /**
   * Cancel default route warning
   */
  const handleCancelDefaultRoute = useCallback(() => {
    setShowDefaultRouteWarning(false);
    setPendingFormValues(null);
  }, []);

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-component-lg"
      >
        {/* Interface Selection */}
        <FormSection
          title="Interface Configuration"
          description="Select the physical interface to use for DHCP WAN connection"
        >
          <div className="space-y-component-md">
            <div>
              <div className="gap-component-md mb-component-md flex items-center">
                <Label htmlFor="interface-selector">
                  <Network className="mr-1 inline h-4 w-4" />
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
                disabled={loading}
              />
              {form.formState.errors.interface && (
                <p
                  className="text-error mt-1 text-sm"
                  role="alert"
                  id="interface-error"
                >
                  {form.formState.errors.interface.message}
                </p>
              )}
            </div>

            {selectedInterface && (
              <div className="rounded-card-sm border-border bg-muted/50 p-component-md space-y-component-sm category-networking border">
                <h4 className="text-sm font-medium">Selected Interface Details</h4>
                <div className="gap-component-sm grid grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <code className="ml-component-md font-mono text-xs">
                      {selectedInterface.name}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-component-md">{selectedInterface.type}</span>
                  </div>
                  {selectedInterface.mac && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">MAC:</span>
                      <code className="ml-component-md font-mono text-xs">
                        {selectedInterface.mac}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* DHCP Client Settings */}
        <FormSection
          title="DHCP Settings"
          description="Configure how the DHCP client obtains network configuration"
        >
          <div className="space-y-component-md">
            {/* Add Default Route */}
            <div className="gap-component-lg flex items-center justify-between">
              <div className="gap-component-md flex items-center">
                <Label htmlFor="shouldAddDefaultRoute">Add Default Route</Label>
                <FieldHelp field="shouldAddDefaultRoute" />
              </div>
              <Switch
                id="shouldAddDefaultRoute"
                checked={form.watch('shouldAddDefaultRoute')}
                onCheckedChange={(checked) =>
                  form.setValue('shouldAddDefaultRoute', checked, {
                    shouldDirty: true,
                  })
                }
                disabled={loading}
                aria-label="Add default route via DHCP gateway"
              />
            </div>

            {/* Use Peer DNS */}
            <div className="gap-component-lg flex items-center justify-between">
              <div className="gap-component-md flex items-center">
                <Label htmlFor="shouldUsePeerDNS">Use Peer DNS</Label>
                <FieldHelp field="shouldUsePeerDNS" />
              </div>
              <Switch
                id="shouldUsePeerDNS"
                checked={form.watch('shouldUsePeerDNS')}
                onCheckedChange={(checked) =>
                  form.setValue('shouldUsePeerDNS', checked, { shouldDirty: true })
                }
                disabled={loading}
                aria-label="Use DNS servers from DHCP"
              />
            </div>

            {/* Use Peer NTP */}
            <div className="gap-component-lg flex items-center justify-between">
              <div className="gap-component-md flex items-center">
                <Label htmlFor="shouldUsePeerNTP">Use Peer NTP</Label>
                <FieldHelp field="shouldUsePeerNTP" />
              </div>
              <Switch
                id="shouldUsePeerNTP"
                checked={form.watch('shouldUsePeerNTP')}
                onCheckedChange={(checked) =>
                  form.setValue('shouldUsePeerNTP', checked, { shouldDirty: true })
                }
                disabled={loading}
                aria-label="Use NTP servers from DHCP"
              />
            </div>
          </div>
        </FormSection>

        {/* Optional Settings */}
        <FormSection
          title="Optional Settings"
          description="Additional configuration options"
        >
          <div className="space-y-component-md">
            <div className="gap-component-md flex items-center">
              <Label htmlFor="comment">Comment</Label>
              <FieldHelp field="comment" />
            </div>
            <Input
              id="comment"
              type="text"
              maxLength={255}
              placeholder="e.g., Primary WAN connection"
              disabled={loading}
              {...form.register('comment')}
              aria-describedby="comment-error comment-help"
            />
            {form.formState.errors.comment && (
              <p
                id="comment-error"
                className="text-error text-sm"
                role="alert"
              >
                {form.formState.errors.comment.message}
              </p>
            )}
            <p
              id="comment-help"
              className="text-muted-foreground text-xs"
            >
              {form.watch('comment')?.length || 0}/255 characters
            </p>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="gap-component-md flex justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="focus-visible:ring-ring min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || !form.formState.isValid || !form.formState.isDirty}
            className="focus-visible:ring-ring min-h-[44px] min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {loading ? 'Configuring...' : 'Configure DHCP'}
          </Button>
        </div>
      </form>

      {/* Default Route Warning Dialog */}
      <Dialog
        open={showDefaultRouteWarning}
        onOpenChange={setShowDefaultRouteWarning}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="gap-component-md flex items-center">
              <AlertTriangle
                className="text-warning h-5 w-5"
                aria-hidden="true"
              />
              Default Route Warning
            </DialogTitle>
            <DialogDescription className="space-y-component-md">
              <p>
                You are about to add a <strong>default route</strong> via this DHCP connection.
              </p>
              <p className="text-sm">
                <strong>Warning:</strong> If you already have a default route configured (e.g.,
                another WAN connection), this may cause routing conflicts.
              </p>
              <p className="text-muted-foreground text-sm">
                Only proceed if this is your primary internet connection, or if you have configured
                policy routing to handle multiple WAN links.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-component-md">
            <Button
              variant="outline"
              onClick={handleCancelDefaultRoute}
              className="focus-visible:ring-ring min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDefaultRoute}
              className="focus-visible:ring-ring min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              I Understand, Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

DhcpClientForm.displayName = 'DhcpClientForm';
