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
} from '@nasnet/ui/primitives';
import { Input } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Switch } from '@nasnet/ui/primitives';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { AlertTriangle } from 'lucide-react';
import { VlanSelector } from './VlanSelector';
import type { BridgePort } from '@nasnet/api-client/generated';
import { useUpdateBridgePort } from '@nasnet/api-client/queries';
import { toast } from 'sonner';

// Bridge port editor schema with validation
const bridgePortEditorSchema = z.object({
  pvid: z.number().int().min(1).max(4094),
  frameTypes: z.enum(['ADMIT_ALL', 'ADMIT_ONLY_UNTAGGED_AND_PRIORITY', 'ADMIT_ONLY_VLAN_TAGGED']),
  ingressFiltering: z.boolean(),
  taggedVlans: z.array(z.number().int().min(1).max(4094)),
  untaggedVlans: z.array(z.number().int().min(1).max(4094)),
  edge: z.boolean(),
  pathCost: z.number().int().min(1).max(65535).optional(),
}).refine((data) => {
  // Ensure no overlap between tagged and untagged VLANs
  const taggedSet = new Set(data.taggedVlans);
  const overlap = data.untaggedVlans.some((vlan) => taggedSet.has(vlan));
  return !overlap;
}, {
  message: 'Tagged and untagged VLANs must not overlap',
  path: ['taggedVlans'],
});

export type BridgePortEditorData = z.infer<typeof bridgePortEditorSchema>;

export interface BridgePortEditorProps {
  port: BridgePort | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Bridge Port Editor Component - Configure VLAN settings per port
 * Features:
 * - PVID (Port VLAN ID) input
 * - Frame Types dropdown
 * - Ingress Filtering toggle
 * - Tagged VLANs multi-select
 * - Untagged VLANs multi-select
 * - Edge port toggle
 * - Path cost input
 */
export function BridgePortEditor({ port, open, onClose }: BridgePortEditorProps) {
  const [updateBridgePort, { loading: updating }] = useUpdateBridgePort();

  const form = useForm<BridgePortEditorData>({
    resolver: zodResolver(bridgePortEditorSchema) as any,
    defaultValues: {
      pvid: port?.pvid || 1,
      frameTypes: (port?.frameTypes as any) || 'ADMIT_ALL',
      ingressFiltering: port?.ingressFiltering || false,
      taggedVlans: [...(port?.taggedVlans || [])] as number[],
      untaggedVlans: [...(port?.untaggedVlans || [])] as number[],
      edge: port?.edge || false,
      pathCost: port?.pathCost,
    },
  });

  // Reset form when port changes
  if (port && open) {
    form.reset({
      pvid: port.pvid || 1,
      frameTypes: (port.frameTypes as any) || 'ADMIT_ALL',
      ingressFiltering: port.ingressFiltering || false,
      taggedVlans: [...(port.taggedVlans || [])] as number[],
      untaggedVlans: [...(port.untaggedVlans || [])] as number[],
      edge: port.edge || false,
      pathCost: port.pathCost,
    });
  }

  const handleSubmit = async (data: BridgePortEditorData) => {
    if (!port) return;

    try {
      const result = await updateBridgePort({
        variables: {
          portId: port.id,
          input: {
            pvid: data.pvid,
            frameTypes: data.frameTypes,
            ingressFiltering: data.ingressFiltering,
            taggedVlans: data.taggedVlans,
            untaggedVlans: data.untaggedVlans,
            edge: data.edge,
            pathCost: data.pathCost,
          },
        },
      });

      if (result.data?.updateBridgePort?.success) {
        const operationId = result.data.updateBridgePort.operationId;

        toast.success('Port settings updated', {
          duration: 10000,
          action: operationId
            ? {
                label: 'Undo',
                onClick: async () => {
                  toast.info('Undo functionality coming soon');
                },
              }
            : undefined,
        });

        onClose();
      } else {
        const errors = result.data?.updateBridgePort?.errors || [];
        errors.forEach((e: { message: string }) => toast.error(e.message));
      }
    } catch (err: unknown) {
      toast.error('Failed to update port settings');
      console.error(err);
    }
  };

  // Check if PVID is in untagged VLANs
  const pvid = form.watch('pvid');
  const untaggedVlans = form.watch('untaggedVlans');
  const pvidNotInUntagged = pvid && untaggedVlans.length > 0 && !untaggedVlans.includes(pvid);

  if (!port) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Port: {port.interface.name}</DialogTitle>
          <DialogDescription>
            Configure VLAN settings and spanning tree parameters for this bridge port
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
            {/* PVID Warning */}
            {pvidNotInUntagged && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  PVID {pvid} is not in the untagged VLANs list. This is a common
                  misconfiguration. Consider adding it to untagged VLANs.
                </AlertDescription>
              </Alert>
            )}

            {/* PVID */}
            <FormField
              control={form.control}
              name="pvid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PVID (Port VLAN ID) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={4094}
                      disabled={updating}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Default VLAN ID for untagged traffic (1-4094)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frame Types */}
            <FormField
              control={form.control}
              name="frameTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frame Types</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={updating}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frame types" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIT_ALL">Admit All (Default)</SelectItem>
                      <SelectItem value="ADMIT_ONLY_UNTAGGED_AND_PRIORITY">
                        Admit Only Untagged and Priority
                      </SelectItem>
                      <SelectItem value="ADMIT_ONLY_VLAN_TAGGED">
                        Admit Only VLAN Tagged
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Which frame types are allowed on this port
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ingress Filtering */}
            <FormField
              control={form.control}
              name="ingressFiltering"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ingress Filtering</FormLabel>
                    <FormDescription>
                      Drop frames with VLAN IDs not in the allowed list
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={updating}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tagged VLANs */}
            <FormField
              control={form.control}
              name="taggedVlans"
              render={({ field }) => (
                <FormItem>
                  <VlanSelector
                    label="Tagged VLANs"
                    description="VLANs that will be tagged on this port"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={updating}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Untagged VLANs */}
            <FormField
              control={form.control}
              name="untaggedVlans"
              render={({ field }) => (
                <FormItem>
                  <VlanSelector
                    label="Untagged VLANs"
                    description="VLANs that will be untagged on this port (should include PVID)"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={updating}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STP Settings Section */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-4">Spanning Tree Settings</h4>

              {/* Edge Port */}
              <FormField
                control={form.control}
                name="edge"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Edge Port</FormLabel>
                      <FormDescription>
                        Mark as edge port (connects to end devices, not switches)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updating}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Path Cost */}
              <FormField
                control={form.control}
                name="pathCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path Cost</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        max={65535}
                        disabled={updating}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      STP path cost (1-65535, lower is preferred)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
