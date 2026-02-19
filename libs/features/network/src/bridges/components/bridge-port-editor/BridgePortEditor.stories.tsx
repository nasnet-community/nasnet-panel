/**
 * Storybook stories for BridgePortEditor.
 *
 * BridgePortEditor is a Dialog-based form for configuring VLAN and STP
 * settings on a single bridge port. It internally calls `useUpdateBridgePort`
 * (Apollo mutation), which requires a live GraphQL provider.
 *
 * To make the stories self-contained, this file defines a
 * `BridgePortEditorPreview` wrapper that accepts a plain `onSave` callback
 * and renders the same form layout without the Apollo hook – mirroring the
 * same technique used in ConnectionIndicator.stories.tsx.
 *
 * Stories cover:
 *   - Access port (PVID=1, admit-all, no VLANs, edge=true)
 *   - Trunk port (tagged VLANs, ingress filtering)
 *   - PVID misconfiguration warning
 *   - STP-focused port (path cost set, not edge)
 *   - Closed dialog
 *   - Null port (renders nothing)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Schema (mirrors BridgePortEditor)
// ---------------------------------------------------------------------------

const schema = z
  .object({
    pvid: z.number().int().min(1).max(4094),
    frameTypes: z.enum([
      'ADMIT_ALL',
      'ADMIT_ONLY_UNTAGGED_AND_PRIORITY',
      'ADMIT_ONLY_VLAN_TAGGED',
    ]),
    ingressFiltering: z.boolean(),
    taggedVlans: z.array(z.number().int().min(1).max(4094)),
    untaggedVlans: z.array(z.number().int().min(1).max(4094)),
    edge: z.boolean(),
    pathCost: z.number().int().min(1).max(65535).optional(),
  })
  .refine(
    (data) => {
      const taggedSet = new Set(data.taggedVlans);
      return !data.untaggedVlans.some((v) => taggedSet.has(v));
    },
    { message: 'Tagged and untagged VLANs must not overlap', path: ['taggedVlans'] }
  );

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Mock port data shape (subset of BridgePort from generated types)
// ---------------------------------------------------------------------------

interface MockPort {
  id: string;
  interface: { id: string; name: string };
  pvid: number | null;
  frameTypes: string | null;
  ingressFiltering: boolean | null;
  taggedVlans: number[];
  untaggedVlans: number[];
  edge: boolean | null;
  pathCost: number | null;
}

// ---------------------------------------------------------------------------
// BridgePortEditorPreview – hook-free presenter for Storybook
// ---------------------------------------------------------------------------

interface BridgePortEditorPreviewProps {
  port: MockPort | null;
  open: boolean;
  onClose: () => void;
  onSave?: (data: FormData) => void;
  saving?: boolean;
}

function BridgePortEditorPreview({
  port,
  open,
  onClose,
  onSave,
  saving = false,
}: BridgePortEditorPreviewProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      pvid: port?.pvid ?? 1,
      frameTypes: (port?.frameTypes as FormData['frameTypes']) ?? 'ADMIT_ALL',
      ingressFiltering: port?.ingressFiltering ?? false,
      taggedVlans: port?.taggedVlans ?? [],
      untaggedVlans: port?.untaggedVlans ?? [],
      edge: port?.edge ?? false,
      pathCost: port?.pathCost ?? undefined,
    },
  });

  const pvid = form.watch('pvid');
  const untaggedVlans = form.watch('untaggedVlans');
  const pvidNotInUntagged =
    pvid && untaggedVlans.length > 0 && !untaggedVlans.includes(pvid);

  if (!port) return null;

  const handleSubmit = (data: FormData) => {
    onSave?.(data);
    onClose();
  };

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
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 mt-4"
          >
            {/* PVID misconfiguration warning */}
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
                      disabled={saving}
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
                    disabled={saving}
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
                      disabled={saving}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Tagged VLANs – simple input for Storybook (VlanSelector needs provider) */}
            <FormField
              control={form.control}
              name="taggedVlans"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tagged VLANs</FormLabel>
                  <FormDescription>
                    Comma-separated VLAN IDs (e.g. 10,20,30). VLANs that will be
                    tagged on this port.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="10, 20, 30"
                      disabled={saving}
                      value={field.value.join(', ')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const ids = raw
                          .split(',')
                          .map((s) => parseInt(s.trim()))
                          .filter((n) => !isNaN(n) && n >= 1 && n <= 4094);
                        field.onChange(ids);
                      }}
                    />
                  </FormControl>
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
                  <FormLabel>Untagged VLANs</FormLabel>
                  <FormDescription>
                    Comma-separated VLAN IDs. VLANs that will be untagged on this
                    port (should include PVID).
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="1"
                      disabled={saving}
                      value={field.value.join(', ')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const ids = raw
                          .split(',')
                          .map((s) => parseInt(s.trim()))
                          .filter((n) => !isNaN(n) && n >= 1 && n <= 4094);
                        field.onChange(ids);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STP Section */}
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
                        disabled={saving}
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
                        disabled={saving}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        value={field.value ?? ''}
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
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Toggle wrapper so Storybook controls work with open/closed state
// ---------------------------------------------------------------------------

function StoryWrapper(props: BridgePortEditorPreviewProps) {
  const [open, setOpen] = useState(props.open);
  return (
    <div>
      {!open && (
        <Button onClick={() => setOpen(true)}>Open Port Editor</Button>
      )}
      <BridgePortEditorPreview
        {...props}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock ports
// ---------------------------------------------------------------------------

const accessPort: MockPort = {
  id: 'port-uuid-001',
  interface: { id: 'iface-001', name: 'ether2' },
  pvid: 1,
  frameTypes: 'ADMIT_ALL',
  ingressFiltering: false,
  taggedVlans: [],
  untaggedVlans: [1],
  edge: true,
  pathCost: null,
};

const trunkPort: MockPort = {
  id: 'port-uuid-002',
  interface: { id: 'iface-002', name: 'ether3' },
  pvid: 1,
  frameTypes: 'ADMIT_ONLY_VLAN_TAGGED',
  ingressFiltering: true,
  taggedVlans: [10, 20, 30, 40],
  untaggedVlans: [],
  edge: false,
  pathCost: 100,
};

const mismatchedPvidPort: MockPort = {
  id: 'port-uuid-003',
  interface: { id: 'iface-003', name: 'ether4' },
  pvid: 10,
  frameTypes: 'ADMIT_ALL',
  ingressFiltering: false,
  taggedVlans: [],
  untaggedVlans: [1], // PVID 10 not in untagged → shows warning
  edge: false,
  pathCost: null,
};

const stpFocusedPort: MockPort = {
  id: 'port-uuid-004',
  interface: { id: 'iface-004', name: 'sfp-sfpplus1' },
  pvid: 1,
  frameTypes: 'ADMIT_ALL',
  ingressFiltering: false,
  taggedVlans: [],
  untaggedVlans: [1],
  edge: false,
  pathCost: 200,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StoryWrapper> = {
  title: 'Features/Network/Bridges/BridgePortEditor',
  component: StoryWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal dialog for configuring VLAN and STP settings on a single bridge port. ' +
          'Fields: PVID, Frame Types, Ingress Filtering, Tagged VLANs, Untagged VLANs, ' +
          'Edge Port, and STP Path Cost. Shows a warning when PVID is not present in ' +
          'the untagged VLANs list (a common misconfiguration). ' +
          '\n\n' +
          '> **Note:** The production `BridgePortEditor` component calls `useUpdateBridgePort` ' +
          '(Apollo mutation). These stories use a hook-free presenter (`BridgePortEditorPreview`) ' +
          'that mirrors the UI exactly. This pattern follows the approach established in ' +
          '`ConnectionIndicator.stories.tsx`.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    saving: { control: 'boolean' },
    onSave: { action: 'onSave' },
  },
};

export default meta;
type Story = StoryObj<typeof StoryWrapper>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AccessPort: Story = {
  name: 'Access Port (PVID=1, edge=true)',
  args: {
    port: accessPort,
    open: true,
    saving: false,
  },
};

export const TrunkPort: Story = {
  name: 'Trunk Port (tagged VLANs, ingress filtering)',
  args: {
    port: trunkPort,
    open: true,
    saving: false,
  },
};

export const PvidMisconfigurationWarning: Story = {
  name: 'PVID Misconfiguration Warning',
  args: {
    port: mismatchedPvidPort,
    open: true,
    saving: false,
  },
};

export const StpFocused: Story = {
  name: 'STP-Focused Port (path cost set, not edge)',
  args: {
    port: stpFocusedPort,
    open: true,
    saving: false,
  },
};

export const SavingInProgress: Story = {
  name: 'Saving In Progress',
  args: {
    port: accessPort,
    open: true,
    saving: true,
  },
};

export const ClosedDialog: Story = {
  name: 'Closed (open via button)',
  args: {
    port: accessPort,
    open: false,
    saving: false,
  },
};
