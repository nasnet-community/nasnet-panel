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
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Switch,
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
  dhcpClientSchema,
  dhcpClientDefaultValues,
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
export function DhcpClientForm({
  routerId,
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
}: DhcpClientFormProps) {
  const [selectedInterface, setSelectedInterface] = useState<Interface | null>(
    null
  );
  const [showDefaultRouteWarning, setShowDefaultRouteWarning] = useState(false);
  const [pendingFormValues, setPendingFormValues] =
    useState<DhcpClientFormValues | null>(null);

  const form = useForm<DhcpClientFormValues>({
    resolver: zodResolver(dhcpClientSchema),
    defaultValues: {
      ...dhcpClientDefaultValues,
      ...initialValues,
    },
  });

  /**
   * Handle interface selection
   * Updates form value and stores interface object
   */
  const handleInterfaceSelect = (iface: Interface) => {
    setSelectedInterface(iface);
    form.setValue('interface', iface.name, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  /**
   * Handle form submission with safety checks
   * Shows warning if adding default route that might conflict
   */
  const handleFormSubmit = (values: DhcpClientFormValues) => {
    // Check if we're adding a default route
    if (values.addDefaultRoute) {
      // TODO: In Phase 6, check for existing default routes
      // For now, show warning to user
      setPendingFormValues(values);
      setShowDefaultRouteWarning(true);
    } else {
      // No default route, submit directly
      onSubmit(values);
    }
  };

  /**
   * Confirm default route warning and proceed with submission
   */
  const handleConfirmDefaultRoute = () => {
    if (pendingFormValues) {
      onSubmit(pendingFormValues);
    }
    setShowDefaultRouteWarning(false);
    setPendingFormValues(null);
  };

  /**
   * Cancel default route warning
   */
  const handleCancelDefaultRoute = () => {
    setShowDefaultRouteWarning(false);
    setPendingFormValues(null);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Interface Selection */}
        <FormSection
          title="Interface Configuration"
          description="Select the physical interface to use for DHCP WAN connection"
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
                  text="Select an Ethernet interface (ether1, ether2, etc.) to configure as DHCP client. Only one DHCP client is allowed per interface."
                />
              </div>
              <InterfaceSelector
                id="interface-selector"
                routerId={routerId}
                onSelect={handleInterfaceSelect}
                selectedInterface={selectedInterface}
                filter={(iface) =>
                  // Only show Ethernet interfaces
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

        {/* DHCP Client Settings */}
        <FormSection
          title="DHCP Settings"
          description="Configure how the DHCP client obtains network configuration"
        >
          <div className="space-y-4">
            {/* Add Default Route */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="addDefaultRoute">Add Default Route</Label>
                <FieldHelp
                  field="addDefaultRoute"
                  text="Automatically add a default route via the gateway provided by DHCP. Recommended for WAN connections."
                />
              </div>
              <Switch
                id="addDefaultRoute"
                checked={form.watch('addDefaultRoute')}
                onCheckedChange={(checked) =>
                  form.setValue('addDefaultRoute', checked, {
                    shouldDirty: true,
                  })
                }
                disabled={loading}
                aria-label="Add default route via DHCP gateway"
              />
            </div>

            {/* Use Peer DNS */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="usePeerDNS">Use Peer DNS</Label>
                <FieldHelp
                  field="usePeerDNS"
                  text="Use DNS servers provided by the DHCP server. If disabled, you must configure static DNS servers."
                />
              </div>
              <Switch
                id="usePeerDNS"
                checked={form.watch('usePeerDNS')}
                onCheckedChange={(checked) =>
                  form.setValue('usePeerDNS', checked, { shouldDirty: true })
                }
                disabled={loading}
                aria-label="Use DNS servers from DHCP"
              />
            </div>

            {/* Use Peer NTP */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="usePeerNTP">Use Peer NTP</Label>
                <FieldHelp
                  field="usePeerNTP"
                  text="Use NTP (time) servers provided by the DHCP server. If disabled, router will use configured NTP servers."
                />
              </div>
              <Switch
                id="usePeerNTP"
                checked={form.watch('usePeerNTP')}
                onCheckedChange={(checked) =>
                  form.setValue('usePeerNTP', checked, { shouldDirty: true })
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="comment">Comment</Label>
              <FieldHelp
                field="comment"
                text="Optional description for this DHCP client configuration (max 255 characters)."
              />
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
            {loading ? 'Configuring...' : 'Configure DHCP'}
          </Button>
        </div>
      </form>

      {/* Default Route Warning Dialog */}
      <AlertDialog
        open={showDefaultRouteWarning}
        onOpenChange={setShowDefaultRouteWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Default Route Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to add a <strong>default route</strong> via this
                DHCP connection.
              </p>
              <p className="text-sm">
                <strong>Warning:</strong> If you already have a default route
                configured (e.g., another WAN connection), this may cause routing
                conflicts.
              </p>
              <p className="text-sm text-muted-foreground">
                Only proceed if this is your primary internet connection, or if
                you have configured policy routing to handle multiple WAN links.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDefaultRoute}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDefaultRoute}
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
