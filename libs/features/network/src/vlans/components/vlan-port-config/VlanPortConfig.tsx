/**
 * VLAN Port Configuration Component
 *
 * Configures bridge ports for trunk or access mode VLAN operation.
 *
 * Story: NAS-6.7 - Implement VLAN Management
 * AC4: Configure trunk port (multiple tagged VLANs)
 * AC5: Configure access port (single untagged VLAN)
 *
 * @description
 * This component allows administrators to configure bridge port VLAN modes:
 * - **Access Mode:** Port carries single untagged VLAN (PVID). Typical for end devices (PCs, phones).
 * - **Trunk Mode:** Port carries multiple tagged VLANs + optional native VLAN. Typical for inter-switch links.
 *
 * Features:
 * - Mode selection via radio buttons
 * - VLAN ID input with validation (1-4094 per IEEE 802.1Q)
 * - Tagged VLAN list management (add/remove with visual badges)
 * - RouterOS command preview before applying
 * - Safe confirmation with preview
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

import { useState, useCallback, memo } from 'react';
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
  Icon,
} from '@nasnet/ui/primitives';
import { X, Info, Loader2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { ConfigPreview } from '@nasnet/ui/patterns';
import { vlanPortConfigSchema, type VlanPortConfigFormValues } from '../../schemas';
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
  /** Optional CSS classes */
  className?: string;
}

/**
 * VlanPortConfig component - Render function
 */
function VlanPortConfigComponent({
  routerId,
  portId,
  portName,
  initialValues = {},
  onSuccess,
  onCancel,
  className,
}: VlanPortConfigProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { configureVlanPort, loading } = useConfigureVlanPort(routerId);

  const form = useForm<VlanPortConfigFormValues>({
    resolver: zodResolver(vlanPortConfigSchema) as any,
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
  const handleAddVlan = useCallback(() => {
    const vlanId = parseInt(newVlanId, 10);
    if (!isNaN(vlanId) && vlanId >= 1 && vlanId <= 4094) {
      if (!taggedVlanIds.includes(vlanId)) {
        setValue('taggedVlanIds', [...taggedVlanIds, vlanId]);
        setNewVlanId('');
      } else {
        toast.error('VLAN ID already added to list');
      }
    } else {
      toast.error('Invalid VLAN ID (must be 1-4094)');
    }
  }, [newVlanId, taggedVlanIds, setValue]);

  // Remove VLAN ID from tagged list
  const handleRemoveVlan = useCallback(
    (vlanId: number) => {
      setValue(
        'taggedVlanIds',
        taggedVlanIds.filter((id) => id !== vlanId)
      );
    },
    [taggedVlanIds, setValue]
  );

  // Generate RouterOS commands for preview
  const generateCommands = useCallback(
    (values: VlanPortConfigFormValues): string[] => {
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
    },
    [portName]
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (values: VlanPortConfigFormValues) => {
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
          errors.forEach((err: any) => toast.error(err.message));
        }
      } catch (err: unknown) {
        toast.error('Failed to configure port');
      }
    },
    [configureVlanPort, portId, onSuccess]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (value: string) => {
      setValue('mode', value as 'access' | 'trunk');
    },
    [setValue]
  );

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle>Configure VLAN Port: {portName}</CardTitle>
        <CardDescription>
          Set up trunk or access mode for bridge port VLAN operation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-component-md">
          {/* Mode Selection */}
          <div className="space-y-component-sm">
            <Label>Port Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={handleModeChange}
            >
              <div className="gap-component-sm rounded-card-sm border-border p-component-sm flex items-start border">
                <RadioGroupItem
                  value="access"
                  id="access-mode"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="access-mode"
                    className="font-medium"
                  >
                    Access Mode
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Single untagged VLAN. Typical for end devices (PCs, phones, printers).
                  </p>
                </div>
              </div>

              <div className="gap-component-sm rounded-card-sm border-border p-component-sm flex items-start border">
                <RadioGroupItem
                  value="trunk"
                  id="trunk-mode"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="trunk-mode"
                    className="font-medium"
                  >
                    Trunk Mode
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Multiple tagged VLANs. Typical for inter-switch links or uplinks.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* PVID Configuration */}
          <div className="space-y-component-sm">
            <Label htmlFor="pvid">
              {mode === 'access' ? 'VLAN ID' : 'Native VLAN (PVID)'}
              {mode === 'access' && <span className="text-error"> *</span>}
            </Label>
            <Input
              id="pvid"
              type="number"
              min={1}
              max={4094}
              placeholder={mode === 'access' ? '10' : 'Optional (e.g., 1)'}
              className="font-mono"
              {...register('pvid', { valueAsNumber: true })}
              aria-invalid={errors.pvid ? 'true' : 'false'}
              aria-describedby={errors.pvid ? 'pvid-error' : undefined}
            />
            {errors.pvid && (
              <p
                id="pvid-error"
                className="text-error text-sm"
              >
                {errors.pvid.message}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              {mode === 'access' ?
                'VLAN ID for this access port (1-4094)'
              : 'Optional: VLAN for untagged traffic (1-4094)'}
            </p>
          </div>

          {/* Tagged VLANs (Trunk Mode Only) */}
          {mode === 'trunk' && (
            <div className="space-y-component-sm">
              <Label>Tagged VLANs</Label>

              {/* VLAN List */}
              {taggedVlanIds.length > 0 && (
                <div className="gap-component-xs flex flex-wrap">
                  {taggedVlanIds
                    .sort((a, b) => a - b)
                    .map((vlanId) => (
                      <Badge
                        key={vlanId}
                        variant="outline"
                        className="font-mono"
                      >
                        {vlanId}
                        <button
                          type="button"
                          onClick={() => handleRemoveVlan(vlanId)}
                          className="hover:text-error ml-2"
                          aria-label={`Remove VLAN ${vlanId}`}
                        >
                          <Icon
                            icon={X}
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}

              {/* Add VLAN Input */}
              <div className="gap-component-sm flex">
                <Input
                  type="number"
                  min={1}
                  max={4094}
                  placeholder="VLAN ID (e.g., 10)"
                  className="font-mono"
                  value={newVlanId}
                  onChange={(e) => setNewVlanId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVlan();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddVlan}
                  variant="outline"
                >
                  Add
                </Button>
              </div>

              {errors.taggedVlanIds && (
                <p className="text-error text-sm">{errors.taggedVlanIds.message}</p>
              )}

              <p className="text-muted-foreground text-sm">
                List of VLAN IDs allowed tagged on this trunk port
              </p>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Icon
              icon={Info}
              className="h-4 w-4"
              aria-hidden="true"
            />
            <AlertDescription>
              {mode === 'access' ?
                'Access mode admits only untagged traffic and assigns it to the specified VLAN.'
              : 'Trunk mode admits tagged traffic for the specified VLANs. Optionally set a native VLAN for untagged traffic.'
              }
            </AlertDescription>
          </Alert>

          {/* Command Preview */}
          {showPreview && (
            <ConfigPreview
              title="RouterOS Commands"
              script={generateCommands({
                mode: form.getValues().mode,
                pvid: form.getValues().pvid,
                taggedVlanIds: form.getValues().taggedVlanIds ?? [],
              }).join('\n')}
            />
          )}
        </CardContent>

        <CardFooter className="gap-component-md flex justify-between">
          <div className="gap-component-sm flex">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
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

          <Button
            type="submit"
            disabled={loading}
          >
            {loading && (
              <Icon
                icon={Loader2}
                className="mr-component-sm h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Apply Configuration
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const VlanPortConfig = memo(VlanPortConfigComponent);

VlanPortConfig.displayName = 'VlanPortConfig';
