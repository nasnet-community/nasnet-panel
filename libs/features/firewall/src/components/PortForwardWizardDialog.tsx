/**
 * Port Forward Wizard Dialog
 *
 * 3-step wizard for creating port forwarding rules with SafetyConfirmation.
 * Simplifies the process of configuring destination NAT for incoming traffic.
 *
 * Steps:
 * 1. External Settings - Protocol, external port, WAN interface
 * 2. Internal Settings - Internal IP, internal port
 * 3. Review & Confirm - Summary with SafetyConfirmation
 *
 * @see NAS-7-2: Implement NAT Configuration
 * @see libs/core/types/src/firewall/nat-rule.types.ts - PortForwardSchema
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  toast,
} from '@nasnet/ui/primitives';
import { useStepper, SafetyConfirmation } from '@nasnet/ui/patterns';
import {
  PortForwardSchema,
  type PortForward,
  generatePortForwardSummary,
  COMMON_SERVICE_PORTS,
} from '@nasnet/core/types';
import { useCreatePortForward } from '@nasnet/api-client/queries';

// ============================================================================
// Types
// ============================================================================

interface PortForwardWizardDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change the open state */
  onOpenChange: (open: boolean) => void;
  /** Router IP address */
  routerIp: string;
  /** Available WAN interfaces for selection */
  wanInterfaces?: string[];
  /** Callback when port forward is successfully created */
  onSuccess?: () => void;
  /** Optional CSS class for styling */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PortForwardWizardDialog Component
 *
 * @description 3-step wizard for creating port forwarding rules with
 * SafetyConfirmation integration for dangerous operations.
 *
 * @example
 * ```tsx
 * <PortForwardWizardDialog
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   routerIp="192.168.1.1"
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export const PortForwardWizardDialog = React.memo(function PortForwardWizardDialogComponent({
  open,
  onOpenChange,
  routerIp,
  wanInterfaces = ['ether1', 'ether2'],
  onSuccess,
  className,
}: PortForwardWizardDialogProps) {
  const [showSafetyConfirmation, setShowSafetyConfirmation] = useState(false);

  // React Hook Form setup
  const form = useForm<PortForward>({
    resolver: zodResolver(PortForwardSchema) as any,
    defaultValues: {
      protocol: 'tcp',
      externalPort: 80,
      internalIP: '',
      internalPort: undefined,
      wanInterface: wanInterfaces[0],
      comment: '',
    },
  });

  // Mutation hook for creating port forward
  const createPortForward = useCreatePortForward(routerIp);

  // Stepper configuration
  const stepper = useStepper({
    steps: [
      {
        id: 'external',
        title: 'External Settings',
        description: 'Configure external port and interface',
        validate: async (): Promise<any> => {
          const externalPort = form.getValues('externalPort');
          const protocol = form.getValues('protocol');
          const wanInterface = form.getValues('wanInterface');

          if (!externalPort || externalPort < 1 || externalPort > 65535) {
            return {
              valid: false,
              errors: { externalPort: 'Port must be between 1 and 65535' },
            };
          }

          if (!protocol) {
            return {
              valid: false,
              errors: { protocol: 'Protocol is required' },
            };
          }

          if (!wanInterface) {
            return {
              valid: false,
              errors: { wanInterface: 'WAN interface is required' },
            };
          }

          return { valid: true };
        },
      },
      {
        id: 'internal',
        title: 'Internal Settings',
        description: 'Configure internal IP and port',
        validate: async (): Promise<any> => {
          const internalIP = form.getValues('internalIP');
          const internalPort = form.getValues('internalPort');
          const externalPort = form.getValues('externalPort');

          if (!internalIP) {
            return {
              valid: false,
              errors: { internalIP: 'Internal IP is required' },
            };
          }

          // Validate IPv4 format
          const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
          if (!ipv4Regex.test(internalIP)) {
            return {
              valid: false,
              errors: { internalIP: 'Must be a valid IPv4 address' },
            };
          }

          // Internal port defaults to external port if not provided
          const targetPort = internalPort || externalPort;
          if (targetPort < 1 || targetPort > 65535) {
            return {
              valid: false,
              errors: { internalPort: 'Port must be between 1 and 65535' },
            };
          }

          return { valid: true };
        },
      },
      {
        id: 'review',
        title: 'Review & Confirm',
        description: 'Review configuration and confirm',
      },
    ],
    onComplete: async () => {
      // Show SafetyConfirmation on last step
      setShowSafetyConfirmation(true);
    },
  });

  // ========================================
  // Handlers
  // ========================================

  const handleClose = useCallback(() => {
    form.reset();
    stepper.reset();
    setShowSafetyConfirmation(false);
    onOpenChange(false);
  }, [form, stepper, onOpenChange]);

  const handleConfirmCreate = useCallback(async () => {
    try {
      const formData = form.getValues();

      // Create port forward using mutation hook
      await createPortForward.mutateAsync({
        protocol: formData.protocol as any,
        dstPort: formData.externalPort.toString(),
        toAddresses: formData.internalIP,
        toPorts: (formData.internalPort || formData.externalPort).toString(),
        inInterface: formData.wanInterface,
        comment:
          formData.comment ||
          `Port forward ${formData.externalPort} -> ${formData.internalIP}:${formData.internalPort || formData.externalPort}`,
      });

      // Success toast
      toast({
        title: 'Port Forward Created',
        description: generatePortForwardSummary(formData),
        variant: 'default',
      });

      // Close dialog and trigger success callback
      handleClose();
      onSuccess?.();
    } catch (error) {
      // Error toast
      toast({
        title: 'Failed to Create Port Forward',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  }, [createPortForward, form, handleClose, onSuccess]);

  // ========================================
  // Form Data Helpers
  // ========================================

  const formData = form.watch();
  const summary = useMemo(
    () =>
      generatePortForwardSummary({
        ...formData,
        internalPort: formData.internalPort || formData.externalPort,
      }),
    [formData]
  );

  // ========================================
  // Render
  // ========================================

  return (
    <>
      {/* Main Wizard Dialog */}
      <Dialog
        open={open && !showSafetyConfirmation}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Port Forward</DialogTitle>
            <DialogDescription>
              Step {stepper.currentIndex + 1} of {stepper.totalSteps}: {stepper.currentStep.title}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mb-component-md">
            <div className="gap-component-md flex">
              {stepper.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded ${
                    index <= stepper.currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: External Settings */}
          {stepper.currentIndex === 0 && (
            <div className="space-y-component-md">
              {/* Protocol */}
              <div className="space-y-component-sm">
                <Label htmlFor="protocol">Protocol</Label>
                <Controller
                  name="protocol"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="protocol">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* External Port */}
              <div className="space-y-component-sm">
                <Label htmlFor="externalPort">External Port</Label>
                <Controller
                  name="externalPort"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="externalPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder="e.g., 80"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  )}
                />
                {form.formState.errors.externalPort && (
                  <p className="text-error text-sm">{form.formState.errors.externalPort.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Common ports: HTTP (80), HTTPS (443), SSH (22), RDP (3389)
                </p>
              </div>

              {/* WAN Interface */}
              <div className="space-y-component-sm">
                <Label htmlFor="wanInterface">WAN Interface</Label>
                <Controller
                  name="wanInterface"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="wanInterface">
                        <SelectValue placeholder="Select interface" />
                      </SelectTrigger>
                      <SelectContent>
                        {wanInterfaces.map((iface) => (
                          <SelectItem
                            key={iface}
                            value={iface}
                          >
                            {iface}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 2: Internal Settings */}
          {stepper.currentIndex === 1 && (
            <div className="space-y-component-md">
              {/* Internal IP */}
              <div className="space-y-component-sm">
                <Label htmlFor="internalIP">Internal IP Address</Label>
                <Controller
                  name="internalIP"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="internalIP"
                      type="text"
                      placeholder="e.g., 192.168.1.100"
                      {...field}
                    />
                  )}
                />
                {form.formState.errors.internalIP && (
                  <p className="text-error text-sm">{form.formState.errors.internalIP.message}</p>
                )}
              </div>

              {/* Internal Port */}
              <div className="space-y-component-sm">
                <Label htmlFor="internalPort">
                  Internal Port <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Controller
                  name="internalPort"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="internalPort"
                      type="number"
                      min={1}
                      max={65535}
                      placeholder={`Same as external (${formData.externalPort})`}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                      }
                    />
                  )}
                />
                {form.formState.errors.internalPort && (
                  <p className="text-error text-sm">{form.formState.errors.internalPort.message}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Leave blank to use the same port as external
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-component-sm">
                <Label htmlFor="comment">
                  Comment <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Controller
                  name="comment"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="comment"
                      type="text"
                      placeholder="e.g., Web server"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {stepper.currentIndex === 2 && (
            <div className="space-y-component-md">
              <div className="p-component-md space-y-component-md rounded-md border">
                <h3 className="font-semibold">Configuration Summary</h3>
                <div className="space-y-component-md text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol:</span>
                    <span className="font-mono">{formData.protocol.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">External Port:</span>
                    <span className="font-mono tabular-nums">{formData.externalPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WAN Interface:</span>
                    <span className="font-mono tabular-nums">{formData.wanInterface}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internal IP:</span>
                    <span className="font-mono tabular-nums">{formData.internalIP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internal Port:</span>
                    <span className="font-mono tabular-nums">
                      {formData.internalPort || formData.externalPort}
                    </span>
                  </div>
                  {formData.comment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comment:</span>
                      <span>{formData.comment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-warning/10 border-warning/30 p-component-md rounded-md border">
                <p className="text-foreground text-sm font-medium">{summary}</p>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {stepper.errors && Object.keys(stepper.errors).length > 0 && (
            <div className="bg-error/10 border-error/20 p-component-md rounded-md border">
              <p className="text-error text-sm">{Object.values(stepper.errors)[0]}</p>
            </div>
          )}

          {/* Dialog Footer - Navigation Buttons */}
          <DialogFooter className="gap-component-sm">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {!stepper.isFirst && (
              <Button
                variant="outline"
                onClick={stepper.prev}
              >
                Back
              </Button>
            )}
            {!stepper.isLast && (
              <Button
                onClick={stepper.next}
                disabled={stepper.isValidating}
              >
                Next
              </Button>
            )}
            {stepper.isLast && (
              <Button
                onClick={() => stepper.next()}
                disabled={stepper.isValidating}
              >
                Review
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Confirmation Dialog */}
      <SafetyConfirmation
        open={showSafetyConfirmation}
        onOpenChange={setShowSafetyConfirmation}
        title="Create Port Forward"
        description="You are about to create a port forwarding rule that will expose an internal service to the internet."
        consequences={[
          'External traffic will be forwarded to your internal network',
          'The internal service will be accessible from the internet',
          'Ensure the internal service is properly secured',
          'This may expose security vulnerabilities if misconfigured',
        ]}
        confirmText="FORWARD"
        countdownSeconds={5}
        onConfirm={handleConfirmCreate}
        onCancel={() => {
          setShowSafetyConfirmation(false);
          // Stay on the wizard at review step
        }}
      />
    </>
  );
});

PortForwardWizardDialog.displayName = 'PortForwardWizardDialog';
