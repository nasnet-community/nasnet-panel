/**
 * AlertRuleForm component
 *
 * Form for creating and editing alert rules. Supports configuration of trigger
 * conditions, severity levels, notification channels, and enable/disable toggling.
 * Handles both creation and update workflows. Form validation via Zod schema.
 *
 * @description Per Task 4.1: Create AlertRuleForm component for creating/editing alert rules
 * @example
 * // Create new rule
 * <AlertRuleForm onSuccess={handleSuccess} />
 *
 * // Edit existing rule
 * <AlertRuleForm ruleId="rule-123" initialData={ruleData} onSuccess={handleSuccess} />
 *
 * @see useCreateAlertRule
 * @see useUpdateAlertRule
 */
import { AlertCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState, memo } from 'react';
import {
  type AlertRuleFormData,
  alertRuleFormSchema,
  defaultAlertRule,
  SEVERITY_CONFIG,
  NOTIFICATION_CHANNELS,
  OPERATOR_CONFIG,
} from '../schemas/alert-rule.schema';
import { useCreateAlertRule, useUpdateAlertRule } from '../hooks/useAlertRules';
import { cn } from '@nasnet/ui/utils';
import { Icon } from '@nasnet/ui/primitives';

/**
 * @interface AlertRuleFormProps
 * @description Props for AlertRuleForm component
 */
interface AlertRuleFormProps {
  /** Initial form data (for editing existing rules) */
  initialData?: Partial<AlertRuleFormData>;
  /** Rule ID (if editing existing rule) */
  ruleId?: string;
  /** Callback on successful save */
  onSuccess?: () => void;
  /** Callback on cancel */
  onCancel?: () => void;
  /** Optional CSS className for custom styling */
  className?: string;
}

/**
 * Form for creating and editing alert rules with conditions, severity, and channels.
 * Supports both new rule creation and editing existing rules. Auto-disables submit
 * when no changes detected. Shows loading state during save operations.
 *
 * @component
 * @example
 * return <AlertRuleForm ruleId="rule-1" onSuccess={handleSuccess} />;
 */
const AlertRuleForm = memo(
  function AlertRuleForm({
    initialData,
    ruleId,
    onSuccess,
    onCancel,
    className,
  }: AlertRuleFormProps) {
    const isEditing = useMemo(() => Boolean(ruleId), [ruleId]);
    const { createRule, loading: isCreating } = useCreateAlertRule();
    const { updateRule, loading: isUpdating } = useUpdateAlertRule();
    const [error, setError] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isDirty },
    } = useForm<AlertRuleFormData>({
      resolver: zodResolver(alertRuleFormSchema) as any,
      defaultValues: initialData || defaultAlertRule,
    });

    const conditions = watch('conditions') || [];
    const selectedChannels = watch('channels') || [];
    const severity = watch('severity');

    // Stable callback for form submission
    const handleFormSubmit = useCallback(
      async (data: AlertRuleFormData) => {
        try {
          setError(null);
          if (isEditing && ruleId) {
            await updateRule(ruleId, data);
          } else {
            await createRule(data);
          }
          onSuccess?.();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to save alert rule'
          );
        }
      },
      [isEditing, ruleId, updateRule, createRule, onSuccess]
    );

    // Stable callback for adding conditions
    const handleAddCondition = useCallback(() => {
      setValue('conditions', [
        ...conditions,
        { field: '', operator: 'EQUALS', value: '' },
      ]);
    }, [conditions, setValue]);

    // Stable callback for removing conditions
    const handleRemoveCondition = useCallback(
      (index: number) => {
        setValue(
          'conditions',
          conditions.filter((_, i) => i !== index)
        );
      },
      [conditions, setValue]
    );

    // Stable callback for toggling channels
    const handleToggleChannel = useCallback(
      (channel: string) => {
        const updated = selectedChannels.includes(channel)
          ? selectedChannels.filter((c) => c !== channel)
          : [...selectedChannels, channel];
        setValue('channels', updated);
      },
      [selectedChannels, setValue]
    );

    const isLoading = isCreating || isUpdating;

    return (
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className={cn('space-y-component-lg', className)}
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-semibold">
            {isEditing ? 'Edit Alert Rule' : 'Create Alert Rule'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure alerts for router events and system conditions
          </p>
        </div>

        {error && (
          <div
            className="p-component-md bg-error/10 text-error rounded-[var(--semantic-radius-card)] text-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex gap-component-sm">
              <Icon
                icon={AlertCircle}
                className="h-4 w-4 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>{error}</div>
            </div>
          </div>
        )}

      {/* Basic Info */}
      <div className="space-y-component-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-component-sm">
            Rule Name *
          </label>
          <input
            {...register('name')}
            id="name"
            type="text"
            className="w-full px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="e.g., High CPU Alert"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-error mt-component-sm" role="alert">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-component-sm">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            className="w-full px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            rows={2}
            placeholder="Optional description of this alert rule"
          />
        </div>

        <div>
          <label htmlFor="eventType" className="block text-sm font-medium mb-component-sm">
            Event Type *
          </label>
          <input
            {...register('eventType')}
            id="eventType"
            type="text"
            className="w-full px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)] font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="e.g., device.cpu.high"
            aria-invalid={!!errors.eventType}
            aria-describedby={errors.eventType ? 'eventType-error' : undefined}
          />
          {errors.eventType && (
            <p id="eventType-error" className="text-sm text-error mt-component-sm" role="alert">{errors.eventType.message}</p>
          )}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label htmlFor="severity-group" className="block text-sm font-medium mb-component-sm" id="severity-group-label">Severity *</label>
        <div id="severity-group" className="flex gap-component-md" role="radiogroup" aria-labelledby="severity-group-label">
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <label
              key={key}
              className={`flex-1 p-component-sm border-2 rounded-[var(--semantic-radius-card)] cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 ${
                severity === key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                {...register('severity')}
                type="radio"
                value={key}
                className="sr-only"
              />
              <div className="font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground mt-component-sm">
                {config.description}
              </div>
            </label>
          ))}
        </div>
        {errors.severity && (
          <p className="text-sm text-error mt-component-sm" role="alert">{errors.severity.message}</p>
        )}
      </div>

        {/* Conditions */}
        <div>
          <label htmlFor="conditions-section" className="block text-sm font-medium mb-2">Conditions *</label>
          <div id="conditions-section" className="space-y-component-sm">
            {conditions.map((condition, index) => (
              <div key={index} className="flex gap-component-sm items-start">
                <input
                  {...register(`conditions.${index}.field`)}
                  placeholder="Field"
                  aria-label={`Condition ${index + 1} field`}
                  className={cn(
                    'flex-1 px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)] font-mono',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2'
                  )}
                />
                <select
                  {...register(`conditions.${index}.operator`)}
                  aria-label={`Condition ${index + 1} operator`}
                  className={cn(
                    'w-32 px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2'
                  )}
                >
                  {Object.entries(OPERATOR_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <input
                  {...register(`conditions.${index}.value`)}
                  placeholder="Value"
                  aria-label={`Condition ${index + 1} value`}
                  className={cn(
                    'flex-1 px-component-md py-component-sm border border-border rounded-[var(--semantic-radius-button)] font-mono',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2'
                  )}
                />
                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(index)}
                    aria-label={`Remove condition ${index + 1}`}
                    className={cn(
                      'min-h-[44px] px-component-md py-component-sm text-error hover:bg-error/10 rounded-[var(--semantic-radius-button)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'focus-visible:ring-offset-2'
                    )}
                  >
                    <Icon
                      icon={X}
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddCondition}
            aria-label="Add new condition"
            className={cn(
              'mt-component-sm text-sm text-primary hover:underline rounded-[var(--semantic-radius-button)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2'
            )}
          >
            + Add Condition
          </button>
          {errors.conditions && (
            <p className="text-sm text-error mt-1" role="alert">
              {errors.conditions.message}
            </p>
          )}
        </div>

        {/* Channels */}
        <div>
          <label htmlFor="channels-section" className="block text-sm font-medium mb-2">
            Notification Channels *
          </label>
          <div id="channels-section" className="grid grid-cols-2 gap-component-sm">
            {NOTIFICATION_CHANNELS.map((channel) => (
              <label
                key={channel.value}
                className={cn(
                  'flex items-center gap-component-sm p-component-sm border-2 rounded-[var(--semantic-radius-card)] cursor-pointer',
                  'transition-colors has-[:focus-visible]:ring-2',
                  'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
                  selectedChannels.includes(channel.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedChannels.includes(channel.value)}
                  onChange={() => handleToggleChannel(channel.value)}
                  aria-label={`Enable ${channel.label} notifications`}
                  className="rounded"
                />
                <span className="text-sm font-medium">{channel.label}</span>
              </label>
            ))}
          </div>
          {errors.channels && (
            <p className="text-sm text-error mt-1" role="alert">
              {errors.channels.message}
            </p>
          )}
        </div>

        {/* Enabled Toggle */}
        <div>
          <label className="flex items-center gap-component-sm cursor-pointer">
            <input {...register('enabled')} type="checkbox" className="rounded" />
            <span className="text-sm font-medium">
              Enable this rule immediately
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className={cn('flex gap-component-md justify-end pt-component-lg border-t border-border')}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'min-h-[44px] px-component-lg py-component-sm border border-border rounded-[var(--semantic-radius-button)] hover:bg-muted',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2'
              )}
              disabled={isLoading}
              aria-label="Cancel alert rule editing"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={cn(
              'min-h-[44px] px-component-lg py-component-sm bg-primary text-primary-foreground rounded-[var(--semantic-radius-button)]',
              'hover:bg-primary/90 disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2'
            )}
            disabled={isLoading || !isDirty}
            aria-label={
              isLoading
                ? 'Saving alert rule'
                : isEditing
                  ? 'Update alert rule'
                  : 'Create alert rule'
            }
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    );
  }
);

AlertRuleForm.displayName = 'AlertRuleForm';

export { AlertRuleForm };
export type { AlertRuleFormProps };
