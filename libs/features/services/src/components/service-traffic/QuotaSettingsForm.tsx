/**
 * QuotaSettingsForm Component
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * Form for configuring traffic quota with validation:
 * - Quota period (daily/weekly/monthly)
 * - Limit in bytes (with GB/TB input)
 * - Warning threshold percentage
 * - Action when quota exceeded (log/alert/stop/throttle)
 *
 * Uses React Hook Form + Zod validation
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, AlertCircle, Trash2 } from 'lucide-react';

import {
  useSetTrafficQuota,
  useResetTrafficQuota,
} from '@nasnet/api-client/queries';
import type { TrafficQuota } from '@nasnet/api-client/generated';
import { QuotaPeriod, QuotaAction } from '@nasnet/api-client/generated';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

/**
 * Validation schema for quota settings form
 */
const quotaSettingsSchema = z.object({
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'] as const, {
    required_error: 'Quota period is required',
  }),
  limitGB: z
    .number({
      required_error: 'Quota limit is required',
      invalid_type_error: 'Quota limit must be a number',
    })
    .positive('Quota limit must be greater than 0')
    .max(10000, 'Quota limit cannot exceed 10,000 GB'),
  warningThreshold: z
    .number({
      required_error: 'Warning threshold is required',
      invalid_type_error: 'Warning threshold must be a number',
    })
    .min(1, 'Warning threshold must be at least 1%')
    .max(100, 'Warning threshold cannot exceed 100%'),
  action: z.enum(['LOG_ONLY', 'ALERT', 'STOP_SERVICE', 'THROTTLE'] as const, {
    required_error: 'Quota action is required',
  }),
});

type QuotaSettingsFormData = z.infer<typeof quotaSettingsSchema>;

/**
 * QuotaSettingsForm props
 */
export interface QuotaSettingsFormProps {
  /** Router ID */
  routerID: string;
  /** Service instance ID */
  instanceID: string;
  /** Current quota (if set) */
  currentQuota?: TrafficQuota | null;
  /** Success callback */
  onSuccess?: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Converts GB to bytes
 */
function gbToBytes(gb: number): number {
  return Math.floor(gb * 1024 * 1024 * 1024);
}

/**
 * Converts bytes to GB
 */
function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

/**
 * QuotaSettingsForm component
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Period selection (daily/weekly/monthly)
 * - Limit input in GB (converted to bytes)
 * - Warning threshold percentage
 * - Action selection with descriptions
 * - Remove quota button
 * - Success/error feedback
 */
export function QuotaSettingsForm({
  routerID,
  instanceID,
  currentQuota,
  onSuccess,
  onError,
  className,
}: QuotaSettingsFormProps) {
  const [setQuota, { loading: settingQuota }] = useSetTrafficQuota();
  const [resetQuota, { loading: resettingQuota }] = useResetTrafficQuota();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loading = settingQuota || resettingQuota;

  // Initialize form with current quota or defaults
  const form = useForm<QuotaSettingsFormData>({
    resolver: zodResolver(quotaSettingsSchema),
    defaultValues: {
      period: currentQuota?.period ?? 'MONTHLY',
      limitGB: currentQuota ? bytesToGB(currentQuota.limitBytes) : 100,
      warningThreshold: currentQuota?.warningThreshold ?? 80,
      action: currentQuota?.action ?? 'ALERT',
    },
  });

  // Handle form submission
  const handleSubmit = async (values: QuotaSettingsFormData) => {
    setSuccessMessage(null);

    try {
      const result = await setQuota({
        variables: {
          input: {
            routerID,
            instanceID,
            period: values.period as QuotaPeriod,
            limitBytes: gbToBytes(values.limitGB),
            warningThreshold: values.warningThreshold,
            action: values.action as QuotaAction,
          },
        },
      });

      if (result.data?.setTrafficQuota.quota) {
        setSuccessMessage('Traffic quota updated successfully');
        onSuccess?.();
      } else if (result.data?.setTrafficQuota.errors?.length) {
        const errors = result.data.setTrafficQuota.errors;
        const errorMessage = errors[0]?.message ?? 'Failed to set traffic quota';
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
  };

  // Handle quota removal
  const handleRemoveQuota = async () => {
    setSuccessMessage(null);

    try {
      const result = await resetQuota({
        variables: {
          routerID,
          instanceID,
        },
      });

      if (result.data?.resetTrafficQuota.errors?.length === 0) {
        setSuccessMessage('Traffic quota removed successfully');
        onSuccess?.();
        form.reset({
          period: 'MONTHLY',
          limitGB: 100,
          warningThreshold: 80,
          action: 'ALERT',
        });
      } else if (result.data?.resetTrafficQuota.errors?.length) {
        const errors = result.data.resetTrafficQuota.errors;
        const errorMessage = errors[0]?.message ?? 'Failed to remove quota';
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      onError?.(errorObj);
    }
  };

  // Reset form when current quota changes
  React.useEffect(() => {
    if (currentQuota) {
      form.reset({
        period: currentQuota.period as QuotaSettingsFormData['period'],
        limitGB: bytesToGB(currentQuota.limitBytes),
        warningThreshold: currentQuota.warningThreshold,
        action: currentQuota.action as QuotaSettingsFormData['action'],
      });
    }
  }, [currentQuota, form]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Traffic Quota Settings</CardTitle>
        <CardDescription>
          Configure bandwidth limits with automated warnings and enforcement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Success Message */}
          {successMessage && (
            <Alert className="border-green-500 bg-green-50 text-green-900">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Root Error */}
          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="period">Quota Period</Label>
            <Select
              value={form.watch('period')}
              onValueChange={(value) =>
                form.setValue('period', value as QuotaSettingsFormData['period'])
              }
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.period && (
              <p className="text-sm text-destructive">
                {form.formState.errors.period.message}
              </p>
            )}
          </div>

          {/* Limit (GB) */}
          <div className="space-y-2">
            <Label htmlFor="limitGB">Quota Limit (GB)</Label>
            <Input
              id="limitGB"
              type="number"
              step="0.1"
              min="0.1"
              max="10000"
              placeholder="100"
              {...form.register('limitGB', { valueAsNumber: true })}
              className={cn(
                form.formState.errors.limitGB && 'border-destructive'
              )}
            />
            {form.formState.errors.limitGB && (
              <p className="text-sm text-destructive">
                {form.formState.errors.limitGB.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum bandwidth allowed per {form.watch('period').toLowerCase()} period
            </p>
          </div>

          {/* Warning Threshold */}
          <div className="space-y-2">
            <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
            <Input
              id="warningThreshold"
              type="number"
              min="1"
              max="100"
              placeholder="80"
              {...form.register('warningThreshold', { valueAsNumber: true })}
              className={cn(
                form.formState.errors.warningThreshold && 'border-destructive'
              )}
            />
            {form.formState.errors.warningThreshold && (
              <p className="text-sm text-destructive">
                {form.formState.errors.warningThreshold.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Trigger warning alert when usage exceeds this percentage
            </p>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <Label htmlFor="action">Action When Quota Exceeded</Label>
            <Select
              value={form.watch('action')}
              onValueChange={(value) =>
                form.setValue('action', value as QuotaSettingsFormData['action'])
              }
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOG_ONLY">
                  Log Only - No enforcement
                </SelectItem>
                <SelectItem value="ALERT">
                  Alert - Show notification
                </SelectItem>
                <SelectItem value="STOP_SERVICE">
                  Stop Service - Halt traffic
                </SelectItem>
                <SelectItem value="THROTTLE">
                  Throttle - Reduce bandwidth
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.action && (
              <p className="text-sm text-destructive">
                {form.formState.errors.action.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {settingQuota && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {currentQuota ? 'Update Quota' : 'Set Quota'}
            </Button>
            {currentQuota && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemoveQuota}
                disabled={loading}
              >
                {resettingQuota && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Quota
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
