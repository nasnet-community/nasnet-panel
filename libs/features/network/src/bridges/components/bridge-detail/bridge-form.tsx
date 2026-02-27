import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@nasnet/ui/primitives';
import { memo, useState } from 'react';
import { SafetyConfirmation } from '@nasnet/ui/patterns';
import type { Bridge } from '@nasnet/api-client/generated';

// Bridge form schema with validation
const bridgeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Bridge name is required')
    .max(64, 'Name must be 64 characters or less')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Name can only contain letters, numbers, hyphens, and underscores'),
  comment: z.string().max(255, 'Comment must be 255 characters or less').optional(),
  protocol: z.enum(['none', 'stp', 'rstp', 'mstp']),
  priority: z.number().int().min(0).max(65535).default(32768),
  vlanFiltering: z.boolean().default(false),
  pvid: z.number().int().min(1).max(4094).default(1),
  mtu: z.number().int().min(68).max(65535).default(1500),
});

export type BridgeFormData = z.infer<typeof bridgeFormSchema>;

export interface BridgeFormProps {
  bridge?: Bridge | null;
  onSubmit: (data: BridgeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const BridgeForm = memo(function BridgeForm({
  bridge,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BridgeFormProps) {
  const [vlanFilteringWarningOpen, setVlanFilteringWarningOpen] = useState(false);
  const [pendingData, setPendingData] = useState<BridgeFormData | null>(null);

  const isEditing = !!bridge;

  const form = useForm<BridgeFormData>({
    resolver: zodResolver(bridgeFormSchema) as never,
    defaultValues: {
      name: bridge?.name || '',
      comment: bridge?.comment || '',
      protocol: (bridge?.protocol as 'none' | 'stp' | 'rstp' | 'mstp') || 'rstp',
      priority: bridge?.priority || 32768,
      vlanFiltering: bridge?.vlanFiltering || false,
      pvid: bridge?.pvid || 1,
      mtu: bridge?.mtu || 1500,
    },
  });

  const handleFormSubmit = async (data: BridgeFormData) => {
    // Check if enabling VLAN filtering for the first time
    const wasVlanFilteringDisabled = !bridge?.vlanFiltering;
    const isEnablingVlanFiltering = data.vlanFiltering && wasVlanFilteringDisabled;

    if (isEnablingVlanFiltering && isEditing) {
      // Show warning dialog
      setPendingData(data);
      setVlanFilteringWarningOpen(true);
    } else {
      await onSubmit(data);
    }
  };

  const confirmVlanFiltering = async () => {
    if (pendingData) {
      setVlanFilteringWarningOpen(false);
      await onSubmit(pendingData);
      setPendingData(null);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit as never)}
          className="space-y-component-lg"
        >
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bridge Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="bridge1"
                    disabled={isEditing || isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Unique name for the bridge (cannot be changed after creation)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Comment */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Optional description"
                    disabled={isSubmitting}
                    rows={2}
                  />
                </FormControl>
                <FormDescription>Optional description for this bridge</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* STP Protocol */}
          <FormField
            control={form.control}
            name="protocol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>STP Protocol</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select STP protocol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (No STP)</SelectItem>
                    <SelectItem value="stp">STP (802.1D)</SelectItem>
                    <SelectItem value="rstp">RSTP (802.1w) - Recommended</SelectItem>
                    <SelectItem value="mstp">MSTP (802.1s)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Spanning Tree Protocol prevents loops in network topology
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority (only show if STP is enabled) */}
          {form.watch('protocol') !== 'none' && (
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bridge Priority</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={65535}
                      step={4096}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower priority becomes root bridge (multiples of 4096)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* VLAN Filtering */}
          <FormField
            control={form.control}
            name="vlanFiltering"
            render={({ field }) => (
              <FormItem className="p-component-md flex flex-row items-center justify-between rounded-lg border">
                <div className="space-y-component-xs">
                  <FormLabel className="text-base">VLAN Filtering</FormLabel>
                  <FormDescription>
                    Enable VLAN filtering for per-port VLAN assignment
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    aria-label="Toggle VLAN filtering"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* PVID (only show if VLAN filtering is enabled) */}
          {form.watch('vlanFiltering') && (
            <FormField
              control={form.control}
              name="pvid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PVID (Port VLAN ID)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={4094}
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Default VLAN ID for untagged traffic on bridge ports (1-4094)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* MTU */}
          <FormField
            control={form.control}
            name="mtu"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MTU (Maximum Transmission Unit)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={68}
                    max={65535}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Maximum packet size in bytes (default: 1500)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="gap-component-sm flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ?
                'Saving...'
              : isEditing ?
                'Update Bridge'
              : 'Create Bridge'}
            </Button>
          </div>
        </form>
      </Form>

      {/* VLAN Filtering Warning */}
      <SafetyConfirmation
        open={vlanFilteringWarningOpen}
        onOpenChange={setVlanFilteringWarningOpen}
        title="Enable VLAN Filtering"
        description="Enabling VLAN filtering may disrupt network connectivity if VLANs are not properly configured on all ports."
        consequences={[
          'All ports will need PVID assigned',
          'Tagged/untagged VLAN IDs must be configured correctly',
          ...(bridge?.ports && bridge.ports.length > 0 ?
            [
              `This bridge has ${bridge.ports.length} port(s). Ensure they have VLAN configuration before enabling filtering.`,
            ]
          : []),
        ]}
        confirmText="ENABLE"
        onConfirm={confirmVlanFiltering}
        onCancel={() => {
          setVlanFilteringWarningOpen(false);
          setPendingData(null);
        }}
      />
    </>
  );
});
