/**
 * Masquerade Quick Dialog
 *
 * Simple dialog for quickly creating a masquerade rule.
 * Prompts for output interface and optional comment.
 *
 * @description Dialog-based form for creating NAT masquerade rules. Includes
 * interface selection and optional comment field. Provides contextual help text
 * explaining masquerade functionality.
 *
 * @see NAS-7-2: Implement NAT Configuration - Task 9
 */

import { useState, useCallback, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { cn } from '@nasnet/ui/utils';
import { useCreateMasqueradeRule } from '@nasnet/api-client/queries';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_WAN_INTERFACES = ['ether1', 'ether2'];

// ============================================================================
// TYPES & SCHEMA
// ============================================================================

const MasqueradeFormSchema = z.object({
  outInterface: z.string().min(1, 'WAN interface is required.'),
  comment: z.string().optional(),
});

type MasqueradeForm = z.infer<typeof MasqueradeFormSchema>;

interface MasqueradeQuickDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change the open state */
  onOpenChange: (isOpen: boolean) => void;
  /** Router IP address for GraphQL header */
  routerIp: string;
  /** Available WAN interfaces for selection */
  wanInterfaces?: string[];
  /** Callback when masquerade rule is successfully created */
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

function MasqueradeQuickDialogInner({
  open,
  onOpenChange,
  routerIp,
  wanInterfaces = DEFAULT_WAN_INTERFACES,
  onSuccess,
}: MasqueradeQuickDialogProps) {
  const [isCreating, setIsCreating] = useState(false);

  // React Hook Form setup
  const form = useForm<MasqueradeForm>({
    resolver: zodResolver(MasqueradeFormSchema),
    defaultValues: {
      outInterface: wanInterfaces[0] || '',
      comment: '',
    },
  });

  // Mutation hook for creating masquerade rule
  const createMasquerade = useCreateMasqueradeRule(routerIp);

  // ========================================
  // HANDLERS
  // ========================================

  const handleClose = useCallback(() => {
    form.reset();
    onOpenChange(false);
  }, [form, onOpenChange]);

  const handleCreate = useCallback(async (data: MasqueradeForm) => {
    setIsCreating(true);
    try {
      await createMasquerade.mutateAsync({
        outInterface: data.outInterface,
        comment: data.comment || `Masquerade on ${data.outInterface}`,
      });

      // Success toast
      toast({
        title: 'Masquerade Rule Created',
        description: `Successfully created masquerade rule on ${data.outInterface}.`,
        variant: 'default',
      });

      // Close dialog and trigger success callback
      handleClose();
      onSuccess?.();
    } catch (error) {
      // Error toast
      toast({
        title: 'Failed to Create Masquerade Rule',
        description: error instanceof Error ? error.message : 'Unable to create masquerade rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }, [createMasquerade, handleClose, onSuccess]);

  // ========================================
  // Render
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Masquerade</DialogTitle>
          <DialogDescription>
            Create a masquerade rule to hide internal IPs behind the router's WAN interface.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-component-md">
          {/* Output Interface */}
          <div className="space-y-component-sm">
            <Label htmlFor="outInterface">
              WAN Interface <span className="text-error">*</span>
            </Label>
            <Controller
              name="outInterface"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="outInterface">
                    <SelectValue placeholder="Select WAN interface" />
                  </SelectTrigger>
                  <SelectContent>
                    {wanInterfaces.map((iface) => (
                      <SelectItem key={iface} value={iface}>
                        <span className="font-mono">{iface}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.outInterface && (
              <p className="text-sm text-error">
                {form.formState.errors.outInterface.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the WAN interface for outbound traffic masquerading
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
                  placeholder="e.g., Masquerade LAN traffic"
                  {...field}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to "Masquerade on [interface]"
            </p>
          </div>

          {/* Help Text */}
          <div className={cn(
            'rounded-md border p-component-md',
            'bg-info/10',
            'border-info/30'
          )}>
            <p className="text-sm text-foreground">
              <strong>What is masquerading?</strong> Masquerade automatically translates internal
              IP addresses to the router's WAN IP for outbound traffic. This is typically used for
              home and office networks to share a single public IP address.
            </p>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="gap-component-sm">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Masquerade Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

MasqueradeQuickDialogInner.displayName = 'MasqueradeQuickDialog';

export const MasqueradeQuickDialog = memo(MasqueradeQuickDialogInner);
