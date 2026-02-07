/**
 * VLAN Port Configuration Component
 *
 * Configures bridge ports for trunk or access mode VLAN operation.
 *
 * Story: NAS-6.7 - Implement VLAN Management
 * AC4: Configure trunk port (multiple tagged VLANs)
 * AC5: Configure access port (single untagged VLAN)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Input,
  Alert,
  AlertDescription,
  Badge,
} from '@nasnet/ui/primitives';
import { ConfigPreview } from '@nasnet/ui/patterns';
import { Info, Loader2, X } from 'lucide-react';
import {
  vlanPortConfigSchema,
  type VlanPortConfigFormValues,
} from '../../schemas';
import { useConfigureVlanPort } from '@nasnet/api-client/queries';
import { toast } from 'sonner';

/**
 * VLAN Port Configuration Props
 */
export interface VlanPortConfigProps {
  /** Router ID */
  routerId: string;
  /** Bridge port ID to configure */
  portId: string;
  /** Port name (for display) */
  portName: string;
  /** Initial configuration values */
  initialValues?: Partial<VlanPortConfigFormValues>;
  /** Callback when configuration is saved */
  onSuccess?: () => void;
  /** Callback to cancel */
  onCancel?: () => void;
}

/**
 * VLAN Port Configuration Component
 *
 * Allows configuring a bridge port for VLAN operation:
 * - Access Mode: Single untagged VLAN (PVID)
 * - Trunk Mode: Multiple tagged VLANs + optional native VLAN
 *
 * Shows RouterOS command preview before applying.
 *
 * @example
 * ```tsx
 * <VlanPortConfig
 *   routerId={routerId}
 *   portId="ether1"
 *   portName="ether1"
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export function VlanPortConfig({
  routerId,
  portId,
  portName,
  initialValues = {},
  onSuccess,
  onCancel,
}: VlanPortConfigProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { configureVlanPort, loading } = useConfigureVlanPort(routerId);

  const form = useForm<VlanPortConfigFormValues>({
    resolver: zodResolver(vlanPortConfigSchema),
    defaultValues: {
      mode: initialValues.mode || 'access',
      pvid: initialValues.pvid || undefined,
      taggedVlanIds: initialValues.taggedVlanIds || [],
    },
  });

  const {
    register,
    formState: { errors },
    setValue,
    watch,
    handleSubmit,
  } = form;

  const mode = watch('mode');
  const taggedVlanIds = watch('taggedVlanIds') || [];
  const [newVlanId, setNewVlanId] = useState('');

  // Add VLAN ID to tagged list
  const handleAddVlan = () => {
    const vlanId = parseInt(newVlanId, 10);
    if (!isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094) {
      if (!taggedVlanIds.includes(vlanId)) {
        setValue('taggedVlanIds', [...taggedVlanIds, vlanId]);
        setNewVlanId('');
      } else {
        toast.error('VLAN ID already added');
      }
    } else {
      toast.error('Invalid VLAN ID (must be 1-4094)');
    }
  };

  // Remove VLAN ID from tagged list
  const handleRemoveVlan = (vlanId: number) => {
    setValue(
      'taggedVlanIds',
      taggedVlanIds.filter((id) => id !== vlanId)
    );
  };

  // Generate RouterOS commands for preview
  const generateCommands = (values: VlanPortConfigFormValues): string[] => {
    const commands: string[] = [];

    if (values.mode === 'access') {
      // Access mode: Set PVID, admit only untagged
      commands.push(
        `/interface bridge port set [find interface=${portName}] pvid=${values.pvid}`
      );
      commands.push(
        `/interface bridge vlan set [find vlan-ids=${values.pvid}] tagged="" untagged=${portName}`
      );
    } else {
      // Trunk mode: Set PVID (if provided), admit tagged VLANs
      if (values.pvid) {
        commands.push(
          `/interface bridge port set [find interface=${portName}] pvid=${values.pvid}`
        );
      }

      if (values.taggedVlanIds && values.taggedVlanIds.length > 0) {
        values.taggedVlanIds.forEach((vlanId) => {
          commands.push(
            `/interface bridge vlan set [find vlan-ids=${vlanId}] tagged=${portName}`
          );
        });
      }
    }

    return commands;
  };

  // Handle form submission
  const onSubmit = async (values: VlanPortConfigFormValues) => {
    try {
      const result = await configureVlanPort(portId, {
        mode: values.mode,
        pvid: values.pvid,
        taggedVlanIds: values.taggedVlanIds,
      });

      if (result.data?.success) {
        toast.success('Port configured successfully');
        onSuccess?.();
      } else {
        const errors = result.data?.errors || [];
        errors.forEach((err) => toast.error(err.message));
      }
    } catch (err) {
      toast.error('Failed to configure port');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configure VLAN Port: {portName}</CardTitle>
        <CardDescription>
          Set up trunk or access mode for bridge port VLAN operation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>Port Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setValue('mode', value as 'access' | 'trunk')}
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="access" id="access-mode" />
                <div className="flex-1">
                  <Label htmlFor="access-mode" className="font-medium">
                    Access Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Single untagged VLAN. Typical for end devices (PCs, phones,
                    printers).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="trunk" id="trunk-mode" />
                <div className="flex-1">
                  <Label htmlFor="trunk-mode" className="font-medium">
                    Trunk Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Multiple tagged VLANs. Typical for inter-switch links or
                    uplinks.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* PVID Configuration */}
          <div className="space-y-2">
            <Label htmlFor="pvid">
              {mode === 'access' ? 'VLAN ID' : 'Native VLAN (PVID)'}
              {mode === 'access' && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id="pvid"
              type="number"
              min={1}
              max={4094}
              placeholder={mode === 'access' ? '10' : 'Optional (e.g., 1)'}
              {...register('pvid', { valueAsNumber: true })}
              aria-invalid={errors.pvid ? 'true' : 'false'}
              aria-describedby={errors.pvid ? 'pvid-error' : undefined}
            />
            {errors.pvid && (
              <p id="pvid-error" className="text-sm text-destructive">
                {errors.pvid.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {mode === 'access'
                ? 'VLAN ID for this access port (1-4094)'
                : 'Optional: VLAN for untagged traffic (1-4094)'}
            </p>
          </div>

          {/* Tagged VLANs (Trunk Mode Only) */}
          {mode === 'trunk' && (
            <div className="space-y-3">
              <Label>Tagged VLANs</Label>

              {/* VLAN List */}
              {taggedVlanIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {taggedVlanIds.sort((a, b) => a - b).map((vlanId) => (
                    <Badge key={vlanId} variant="outline" className="font-mono">
                      {vlanId}
                      <button
                        type="button"
                        onClick={() => handleRemoveVlan(vlanId)}
                        className="ml-2 hover:text-destructive"
                        aria-label={`Remove VLAN ${vlanId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add VLAN Input */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={4094}
                  placeholder="VLAN ID (e.g., 10)"
                  value={newVlanId}
                  onChange={(e) => setNewVlanId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVlan();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddVlan} variant="outline">
                  Add
                </Button>
              </div>

              {errors.taggedVlanIds && (
                <p className="text-sm text-destructive">
                  {errors.taggedVlanIds.message}
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                List of VLAN IDs allowed tagged on this trunk port
              </p>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {mode === 'access'
                ? 'Access mode admits only untagged traffic and assigns it to the specified VLAN.'
                : 'Trunk mode admits tagged traffic for the specified VLANs. Optionally set a native VLAN for untagged traffic.'}
            </AlertDescription>
          </Alert>

          {/* Command Preview */}
          {showPreview && (
            <ConfigPreview
              title="RouterOS Commands"
              commands={generateCommands(form.getValues())}
              language="routeros"
            />
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
