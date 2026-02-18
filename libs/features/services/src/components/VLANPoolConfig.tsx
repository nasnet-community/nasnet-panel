/**
 * VLANPoolConfig - Domain Component (Layer 3)
 *
 * VLAN pool configuration form with React Hook Form + Zod validation.
 * Allows configuring the allocatable VLAN range (1-4094).
 */

import type React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  toast,
} from '@nasnet/ui/primitives';
import { RHFFormField } from '@nasnet/ui/patterns';
import { useUpdateVLANPoolConfig } from '@nasnet/api-client/queries';

// Validation schema
const vlanPoolConfigSchema = z
  .object({
    poolStart: z
      .number()
      .int()
      .min(1, 'Minimum VLAN ID is 1')
      .max(4094, 'Maximum VLAN ID is 4094'),
    poolEnd: z
      .number()
      .int()
      .min(1, 'Minimum VLAN ID is 1')
      .max(4094, 'Maximum VLAN ID is 4094'),
  })
  .refine((data) => data.poolStart <= data.poolEnd, {
    message: 'Pool start must be less than or equal to pool end',
    path: ['poolEnd'],
  });

type VLANPoolConfigFormValues = z.infer<typeof vlanPoolConfigSchema>;

export interface VLANPoolConfigProps {
  /** Current pool start value */
  poolStart: number;
  /** Current pool end value */
  poolEnd: number;
  /** Number of currently allocated VLANs */
  allocatedCount: number;
  /** Callback when config is successfully updated */
  onSuccess?: () => void;
}

/**
 * VLANPoolConfig - VLAN pool configuration form
 *
 * Features:
 * - Validates VLAN range (1-4094)
 * - Warns if pool is shrinking
 * - Shows subnet template preview
 * - Prevents shrinking below allocated count
 */
export function VLANPoolConfig({
  poolStart,
  poolEnd,
  allocatedCount,
  onSuccess,
}: VLANPoolConfigProps) {
  const { updatePoolConfig, loading } = useUpdateVLANPoolConfig();

  const form = useForm<VLANPoolConfigFormValues>({
    resolver: zodResolver(vlanPoolConfigSchema),
    defaultValues: {
      poolStart,
      poolEnd,
    },
  });

  const watchedStart = form.watch('poolStart');
  const watchedEnd = form.watch('poolEnd');

  // Calculate new pool size
  const currentSize = poolEnd - poolStart + 1;
  const newSize =
    watchedEnd && watchedStart ? watchedEnd - watchedStart + 1 : currentSize;
  const isShrinking = newSize < currentSize;
  const wouldExcludeCurrent =
    watchedStart > poolStart || watchedEnd < poolEnd;

  const onSubmit = async (values: VLANPoolConfigFormValues) => {
    try {
      // Warn if shrinking pool
      if (isShrinking) {
        const confirmed = window.confirm(
          `Warning: You are reducing the pool size from ${currentSize} to ${newSize} VLANs. ` +
            `${allocatedCount} VLANs are currently allocated. ` +
            `This may cause issues if allocations fall outside the new range. Continue?`
        );
        if (!confirmed) return;
      }

      await updatePoolConfig(values);
      toast({ title: 'VLAN pool configuration updated successfully', variant: 'default' });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to update VLAN pool configuration',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>VLAN Pool Configuration</CardTitle>
        <CardDescription>
          Configure the allocatable VLAN range (1-4094). Currently {allocatedCount}{' '}
          VLAN{allocatedCount !== 1 ? 's' : ''} allocated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Pool Start */}
          <RHFFormField
            control={form.control as any}
            name="poolStart"
            label="Pool Start"
            description="First allocatable VLAN ID (minimum 1)"
            renderInput={({ field }: { field: any }) => (
              <Input
                {...field}
                type="number"
                min={1}
                max={4094}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />

          {/* Pool End */}
          <RHFFormField
            control={form.control as any}
            name="poolEnd"
            label="Pool End"
            description="Last allocatable VLAN ID (maximum 4094)"
            renderInput={({ field }: { field: any }) => (
              <Input
                {...field}
                type="number"
                min={1}
                max={4094}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
              />
            )}
          />

          {/* Pool Size Preview */}
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium mb-1">Pool Size Preview</div>
            <div className="text-xs text-muted-foreground">
              Current: {currentSize} VLANs ({poolStart} - {poolEnd})
              <br />
              New: {newSize} VLANs ({watchedStart || poolStart} -{' '}
              {watchedEnd || poolEnd})
            </div>
          </div>

          {/* Subnet Template Preview */}
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium mb-1">Subnet Template</div>
            <div className="text-xs text-muted-foreground">
              Each VLAN will be assigned a subnet:
              <br />
              <code className="bg-background px-1 py-0.5 rounded">
                10.{'{VLAN_ID}'}.0.0/24
              </code>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Example: VLAN 100 → <code className="bg-background px-1 py-0.5 rounded">10.100.0.0/24</code>
            </div>
          </div>

          {/* Warnings */}
          {isShrinking && (
            <div className="p-3 bg-warning/10 border border-warning rounded-md">
              <div className="text-sm font-medium text-warning mb-1">
                Warning: Pool Size Reduction
              </div>
              <div className="text-xs text-warning">
                You are reducing the pool from {currentSize} to {newSize} VLANs.
                {allocatedCount > 0 &&
                  ` ${allocatedCount} VLANs are currently allocated.`}
              </div>
            </div>
          )}

          {wouldExcludeCurrent && allocatedCount > 0 && (
            <div className="p-3 bg-error/10 border border-error rounded-md">
              <div className="text-sm font-medium text-error mb-1">
                Warning: Range Change
              </div>
              <div className="text-xs text-error">
                Changing the pool range may affect existing allocations. Ensure
                all allocated VLANs fall within the new range.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !form.formState.isDirty}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={!form.formState.isDirty}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
