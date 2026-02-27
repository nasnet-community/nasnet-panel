/**
 * Health Check Form Component
 *
 * Configure WAN health monitoring with netwatch integration.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 *
 * @description Form for configuring WAN health checks with target IP, interval, timeout,
 * and failure threshold. Includes quick presets and real-time validation.
 */

import { useEffect, memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSection, FieldHelp } from '@nasnet/ui/patterns';
import { Label, Input, Switch, Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import {
  healthCheckSchema,
  HEALTH_CHECK_DEFAULT_VALUES,
  validateTimeoutInterval,
  HEALTH_CHECK_TARGETS,
  INTERVAL_PRESETS,
  type HealthCheckFormValues,
} from '../../schemas/health-check.schema';
import { Activity, AlertCircle, Zap, Target } from 'lucide-react';

export interface HealthCheckFormProps {
  routerID: string;
  wanID: string;
  gateway?: string; // WAN gateway for preset
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<HealthCheckFormValues>;
}

const HealthCheckFormComponent = ({
  routerID,
  wanID,
  gateway,
  onSuccess,
  onCancel,
  initialValues,
}: HealthCheckFormProps) => {
  const form = useForm<HealthCheckFormValues>({
    resolver: zodResolver(healthCheckSchema) as any,
    defaultValues: initialValues || HEALTH_CHECK_DEFAULT_VALUES,
  });

  const isEnabled = form.watch('isEnabled');
  const targetValue = form.watch('target');
  const intervalValue = form.watch('intervalSeconds');
  const timeoutValue = form.watch('timeoutSeconds');

  // Validate timeout vs interval relationship
  useEffect(() => {
    if (timeoutValue && intervalValue) {
      const validation = validateTimeoutInterval({
        ...form.getValues(),
        intervalSeconds: intervalValue,
        timeoutSeconds: timeoutValue,
      });

      if (!validation.isValid) {
        form.setError('timeoutSeconds', {
          type: 'manual',
          message: validation.error,
        });
      } else {
        form.clearErrors('timeoutSeconds');
      }
    }
  }, [timeoutValue, intervalValue, form]);

  /**
   * Apply health check target preset
   */
  const handleApplyTargetPreset = useCallback((target: string) => {
    // If GATEWAY preset, use actual gateway IP
    if (target === 'gateway' && gateway) {
      form.setValue('target', gateway, { shouldDirty: true });
    } else {
      form.setValue('target', target, { shouldDirty: true });
    }
  }, [gateway, form]);

  /**
   * Apply interval preset
   */
  const handleApplyIntervalPreset = useCallback((interval: number) => {
    form.setValue('intervalSeconds', interval, { shouldDirty: true });
  }, [form]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((async (data: HealthCheckFormValues) => {
    try {
      // TODO: Call GraphQL mutation to configure health check
      console.log('Configure health check:', { routerID, wanID, ...data });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Health check configuration failed:', error);
    }
  }) as any, [routerID, wanID, onSuccess]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-component-lg">
      {/* Enable/Disable Toggle */}
      <FormSection
        title="Health Monitoring"
        description="Monitor WAN connectivity by pinging a target host"
      >
        <div className="flex items-center justify-between gap-component-md">
          <div className="flex items-center gap-component-sm">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="enabled">Enable Health Monitoring</Label>
              <p className="text-xs text-muted-foreground mt-2">
                Monitor connectivity and detect link failures
              </p>
            </div>
          </div>
          <Switch
            id="enabled"
            checked={form.watch('isEnabled')}
            onCheckedChange={(checked) =>
              form.setValue('isEnabled', checked, { shouldDirty: true })
            }
            aria-label="Enable or disable health monitoring"
          />
        </div>

        {!isEnabled && (
          <div className="mt-component-md rounded-card-sm border border-warning/20 bg-warning/5 p-component-md">
            <div className="flex gap-component-md">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Health Monitoring Disabled</p>
                <p className="text-xs text-muted-foreground mt-component-md">
                  WAN link failures will not be detected automatically. Enable
                  monitoring to receive alerts when connectivity is lost.
                </p>
              </div>
            </div>
          </div>
        )}
      </FormSection>

      {isEnabled && (
        <>
          {/* Target Configuration */}
          <FormSection
            title="Health Check Target"
            description="Host or IP address to ping for connectivity checks"
          >
            <div className="space-y-component-md">
              {/* Target Presets */}
              <div>
                <Label className="mb-2 flex items-center gap-component-sm">
                  <Target className="h-4 w-4" />
                  Quick Targets
                </Label>
                <div className="grid grid-cols-2 gap-component-sm">
                  {Object.entries(HEALTH_CHECK_TARGETS).map(([key, preset]) => {
                    // Skip GATEWAY if no gateway provided
                    if (key === 'GATEWAY' && !gateway) return null;

                    const targetVal =
                      key === 'GATEWAY' && gateway ? gateway : preset.value;

                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyTargetPreset(targetVal)}
                        className={cn(
                          targetValue === targetVal && 'border-primary bg-primary/10'
                        )}
                      >
                        <div className="text-left">
                          <div className="font-medium text-xs">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {key === 'GATEWAY' && gateway ? gateway : preset.value}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Target Input */}
              <div>
                <div className="flex items-center gap-component-sm mb-2">
                  <Label htmlFor="target">Target Host/IP</Label>
                  <FieldHelp field="target" />
                </div>
                <Input
                  id="target"
                  type="text"
                  placeholder="e.g., 1.1.1.1 or gateway.example.com"
                  {...form.register('target')}
                  aria-describedby="target-error target-help"
                />
                {form.formState.errors.target && (
                  <p
                    id="target-error"
                    className="text-sm text-error mt-2"
                    role="alert"
                  >
                    {form.formState.errors.target.message}
                  </p>
                )}
                <p id="target-help" className="text-xs text-muted-foreground mt-2">
                  Recommended: Use a public DNS server (1.1.1.1, 8.8.8.8) or your
                  WAN gateway
                </p>
              </div>
            </div>
          </FormSection>

          {/* Check Interval */}
          <FormSection
            title="Check Interval"
            description="How often to ping the target host"
          >
            <div className="space-y-component-md">
              {/* Interval Presets */}
              <div>
                <Label className="mb-2 flex items-center gap-component-sm">
                  <Zap className="h-4 w-4" />
                  Quick Intervals
                </Label>
                <div className="grid grid-cols-2 gap-component-sm">
                  {Object.entries(INTERVAL_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyIntervalPreset(preset.value)}
                      className={cn(
                        intervalValue === preset.value && 'border-primary bg-primary/10'
                      )}
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs">{preset.label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {preset.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Interval Input */}
              <div>
                <div className="flex items-center gap-component-sm mb-2">
                  <Label htmlFor="interval">Interval (seconds)</Label>
                  <FieldHelp field="intervalSeconds" />
                </div>
                <Input
                  id="interval"
                  type="number"
                  min={5}
                  max={300}
                  step={5}
                  {...form.register('intervalSeconds', { valueAsNumber: true })}
                  aria-describedby="interval-error interval-help"
                />
                {form.formState.errors.intervalSeconds && (
                  <p
                    id="interval-error"
                    className="text-sm text-error mt-2"
                    role="alert"
                  >
                    {form.formState.errors.intervalSeconds.message}
                  </p>
                )}
                <p
                  id="interval-help"
                  className="text-xs text-muted-foreground mt-2"
                >
                  Valid range: 5-300 seconds (recommended: 10s)
                </p>
              </div>

              {/* Timeout Input */}
              <div>
                <div className="flex items-center gap-component-sm mb-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <FieldHelp field="timeoutSeconds" />
                </div>
                <Input
                  id="timeout"
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  {...form.register('timeoutSeconds', { valueAsNumber: true })}
                  aria-describedby="timeout-error timeout-help"
                />
                {form.formState.errors.timeoutSeconds && (
                  <p
                    id="timeout-error"
                    className="text-sm text-error mt-2"
                    role="alert"
                  >
                    {form.formState.errors.timeoutSeconds.message}
                  </p>
                )}
                <p
                  id="timeout-help"
                  className="text-xs text-muted-foreground mt-2"
                >
                  Valid range: 1-30 seconds (recommended: 2s)
                </p>
              </div>

              {/* Failure Threshold Input */}
              <div>
                <div className="flex items-center gap-component-sm mb-2">
                  <Label htmlFor="failureThreshold">Failure Threshold</Label>
                  <FieldHelp field="failureThreshold" />
                </div>
                <Input
                  id="failureThreshold"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  {...form.register('failureThreshold', {
                    valueAsNumber: true,
                  })}
                  aria-describedby="failureThreshold-error failureThreshold-help"
                />
                {form.formState.errors.failureThreshold && (
                  <p
                    id="failureThreshold-error"
                    className="text-sm text-error mt-2"
                    role="alert"
                  >
                    {form.formState.errors.failureThreshold.message}
                  </p>
                )}
                <p
                  id="failureThreshold-help"
                  className="text-xs text-muted-foreground mt-2"
                >
                  Valid range: 1-10 (recommended: 3)
                </p>
              </div>
            </div>
          </FormSection>

          {/* Optional Comment */}
          <FormSection
            title="Identification"
            description="Optional comment for this health check"
          >
            <div className="space-y-component-sm">
              <div className="flex items-center gap-component-sm">
                <Label htmlFor="comment">Comment</Label>
                <FieldHelp field="comment" />
              </div>
              <Input
                id="comment"
                type="text"
                maxLength={255}
                placeholder="e.g., Primary WAN Health Check"
                {...form.register('comment')}
                aria-describedby="comment-error comment-help"
              />
              {form.formState.errors.comment && (
                <p
                  id="comment-error"
                  className="text-sm text-error mt-2"
                  role="alert"
                >
                  {form.formState.errors.comment.message}
                </p>
              )}
              <p id="comment-help" className="text-xs text-muted-foreground mt-2">
                {form.watch('comment')?.length || 0}/255 characters
              </p>
            </div>
          </FormSection>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-component-md pt-component-lg border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!form.formState.isValid}>
          {isEnabled ? 'Apply Health Check' : 'Disable Health Check'}
        </Button>
      </div>
    </form>
  );
};

HealthCheckFormComponent.displayName = 'HealthCheckForm';

export const HealthCheckForm = memo(HealthCheckFormComponent);
