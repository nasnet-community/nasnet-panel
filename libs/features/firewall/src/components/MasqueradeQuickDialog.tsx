/**
 * Masquerade Quick Dialog
 *
 * Simple dialog for quickly creating a masquerade rule.
 * Prompts for output interface and optional comment.
 *
 * @see NAS-7-2: Implement NAT Configuration - Task 9
 */

import { useState } from 'react';
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
import { useCreateMasqueradeRule } from '@nasnet/api-client/queries';

// ============================================================================
// Types & Schema
// ============================================================================

const MasqueradeFormSchema = z.object({
  outInterface: z.string().min(1, 'Output interface is required'),
  comment: z.string().optional(),
});

type MasqueradeForm = z.infer<typeof MasqueradeFormSchema>;

interface MasqueradeQuickDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change the open state */
  onOpenChange: (open: boolean) => void;
  /** Router IP address */
  routerIp: string;
  /** Available WAN interfaces for selection */
  wanInterfaces?: string[];
  /** Callback when masquerade rule is successfully created */
  onSuccess?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function MasqueradeQuickDialog({
  open,
  onOpenChange,
  routerIp,
  wanInterfaces = ['ether1', 'ether2'],
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
  // Handlers
  // ========================================

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleCreate = async (data: MasqueradeForm) => {
    setIsCreating(true);
    try {
      await createMasquerade.mutateAsync({
        outInterface: data.outInterface,
        comment: data.comment || `Masquerade on ${data.outInterface}`,
      });

      // Success toast
      toast({
        title: 'Masquerade Rule Created',
        description: `Successfully created masquerade rule on ${data.outInterface}`,
        variant: 'default',
      });

      // Close dialog and trigger success callback
      handleClose();
      onSuccess?.();
    } catch (error) {
      // Error toast
      toast({
        title: 'Failed to Create Masquerade Rule',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

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

        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
          {/* Output Interface */}
          <div className="space-y-2">
            <Label htmlFor="outInterface">
              WAN Interface <span className="text-destructive">*</span>
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
                        {iface}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.outInterface && (
              <p className="text-sm text-destructive">
                {form.formState.errors.outInterface.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the WAN interface for outbound traffic masquerading
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
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
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>What is masquerading?</strong> Masquerade automatically translates internal
              IP addresses to the router's WAN IP for outbound traffic. This is typically used for
              home/office networks to share a single public IP.
            </p>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="gap-2">
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
