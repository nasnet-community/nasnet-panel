/**
 * ResourceLimitsForm Component
 *
 * Form for editing service instance resource limits (memory and CPU weight).
 * Uses React Hook Form + Zod validation with optimistic updates.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';

import { useSetResourceLimits, type ResourceLimits } from '@nasnet/api-client/queries';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@nasnet/ui/primitives';

/**
 * Validation schema for resource limits form
 * Memory: 16-512 MB
 * CPU Weight: 1-10000 (optional)
 */
const resourceLimitsSchema = z.object({
  memoryMB: z
    .number({
      required_error: 'Memory limit is required',
      invalid_type_error: 'Memory limit must be a number',
    })
    .min(16, 'Memory limit must be at least 16 MB')
    .max(512, 'Memory limit cannot exceed 512 MB'),
  cpuWeight: z
    .number({
      invalid_type_error: 'CPU weight must be a number',
    })
    .min(1, 'CPU weight must be at least 1')
    .max(10000, 'CPU weight cannot exceed 10000')
    .optional()
    .nullable(),
});

type ResourceLimitsFormData = z.infer<typeof resourceLimitsSchema>;

/**
 * ResourceLimitsForm props
 */
export interface ResourceLimitsFormProps {
  /** Router ID */
  routerId: string;
  /** Service instance ID */
  instanceId: string;
  /** Current resource limits */
  currentLimits?: ResourceLimits | null;
  /** Success callback */
  onSuccess?: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * ResourceLimitsForm component
 *
 * @description Form for editing service instance resource limits with real-time validation.
 * Uses React Hook Form + Zod for client-side validation and mutation status tracking.
 * Displays success/error states with helpful messaging. Memory values shown in monospace font.
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time error messages (blur validation)
 * - Loading states with spinner
 * - Success/error messaging
 * - Reset form functionality
 * - Current limits display with applied status
 */
export function ResourceLimitsForm({
  routerId,
  instanceId,
  currentLimits,
  onSuccess,
  onError,
}: ResourceLimitsFormProps) {
  const [setLimits, { loading, error }] = useSetResourceLimits();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Form instance with Zod validation
   * Memoized default values prevent unnecessary form resets
   */
  const defaultValues = useMemo(
    () => ({
      memoryMB: currentLimits?.memoryMB ?? 64,
      cpuWeight: currentLimits?.cpuPercent ?? null,
    }),
    [currentLimits?.memoryMB, currentLimits?.cpuPercent]
  );

  const form = useForm<ResourceLimitsFormData>({
    resolver: zodResolver(resourceLimitsSchema),
    defaultValues,
  });

  /**
   * Handle form submission with optimistic UI feedback
   * Stable reference via useCallback to prevent unnecessary memoized component re-renders
   */
  const handleSubmit = useCallback(
    async (values: ResourceLimitsFormData) => {
      setSuccessMessage(null);

      try {
        const result = await setLimits({
          variables: {
            input: {
              routerID: routerId,
              instanceID: instanceId,
              memoryMB: values.memoryMB,
              cpuWeight: values.cpuWeight ?? undefined,
            },
          },
        });

        if (result.data?.setResourceLimits.success) {
          setSuccessMessage('Resource limits updated successfully');
          onSuccess?.();
        } else {
          const errors = result.data?.setResourceLimits.errors ?? [];
          const errorMessage =
            errors[0]?.message ?? 'Failed to update resource limits';
          throw new Error(errorMessage);
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        onError?.(errorObj);
        form.setError('root', {
          type: 'manual',
          message: errorObj.message,
        });
      }
    },
    [routerId, instanceId, setLimits, onSuccess, onError, form]
  );

  /**
   * Reset form when current limits change
   * Allows form to reflect latest server state
   */
  useEffect(() => {
    if (currentLimits) {
      form.reset({
        memoryMB: currentLimits.memoryMB,
        cpuWeight: currentLimits.cpuPercent,
      });
    }
  }, [currentLimits, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Limits</CardTitle>
        <CardDescription>
          Configure memory and CPU resource constraints for this service
          instance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Memory Limit */}
          <div className="space-y-2">
            <Label htmlFor="memoryMB">
              Memory Limit (MB) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="memoryMB"
              type="number"
              min={16}
              max={512}
              step={1}
              {...form.register('memoryMB', { valueAsNumber: true })}
              aria-invalid={!!form.formState.errors.memoryMB}
              aria-describedby={
                form.formState.errors.memoryMB ? 'memoryMB-error' : undefined
              }
            />
            {form.formState.errors.memoryMB && (
              <p
                id="memoryMB-error"
                className="text-sm text-error"
                role="alert"
              >
                {form.formState.errors.memoryMB.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum: 16 MB, Maximum: 512 MB
            </p>
          </div>

          {/* CPU Weight */}
          <div className="space-y-2">
            <Label htmlFor="cpuWeight">CPU Weight (Optional)</Label>
            <Input
              id="cpuWeight"
              type="number"
              min={1}
              max={10000}
              step={1}
              placeholder="Leave empty for default"
              {...form.register('cpuWeight', {
                valueAsNumber: true,
                setValueAs: (v) => (v === '' ? null : Number(v)),
              })}
              aria-invalid={!!form.formState.errors.cpuWeight}
              aria-describedby={
                form.formState.errors.cpuWeight ? 'cpuWeight-error' : undefined
              }
            />
            {form.formState.errors.cpuWeight && (
              <p
                id="cpuWeight-error"
                className="text-sm text-error"
                role="alert"
              >
                {form.formState.errors.cpuWeight.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              CPU scheduling priority (1-10000). Higher values get more CPU time.
            </p>
          </div>

          {/* Form-level error */}
          {form.formState.errors.root && (
            <div
              className="p-3 rounded-md bg-error/10 border border-error/20"
              role="alert"
            >
              <p className="text-sm text-error">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div
              className="p-3 rounded-md bg-success/10 border border-success/20"
              role="status"
            >
              <p className="text-sm text-success font-medium">
                {successMessage}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !form.formState.isDirty}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Limits
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={loading || !form.formState.isDirty}
            >
              Reset
            </Button>
          </div>

          {/* Applied status */}
          {currentLimits && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Current limits:{' '}
                <span className="font-medium font-mono">
                  {currentLimits.memoryMB} MB RAM
                </span>
                {currentLimits.cpuPercent && (
                  <>
                    {' '}
                    &bullet;{' '}
                    <span className="font-medium font-mono">
                      CPU weight {currentLimits.cpuPercent}
                    </span>
                  </>
                )}
                {currentLimits.applied ? (
                  <span className="text-success font-medium">
                    {' '}
                    &bullet; Applied
                  </span>
                ) : (
                  <span className="text-warning font-medium">
                    {' '}
                    &bullet; Not applied (cgroups unavailable)
                  </span>
                )}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
