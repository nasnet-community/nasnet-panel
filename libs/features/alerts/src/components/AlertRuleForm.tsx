/**
 * AlertRuleForm component
 * Per Task 4.1: Create AlertRuleForm component for creating/editing alert rules
 * Per AC1: User can create alert rules with name, trigger condition, severity,
 * notification channels, and optional quiet hours
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type AlertRuleFormData,
  alertRuleFormSchema,
  defaultAlertRule,
  severityConfig,
  notificationChannels,
  operatorConfig,
} from '../schemas/alert-rule.schema';
import { useCreateAlertRule, useUpdateAlertRule } from '../hooks/useAlertRules';
import { useState } from 'react';

interface AlertRuleFormProps {
  initialData?: Partial<AlertRuleFormData>;
  ruleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Desktop/Mobile agnostic AlertRuleForm
 * Per Task 4.10: Mobile presenter would wrap this with full-screen modal pattern
 */
export function AlertRuleForm({ initialData, ruleId, onSuccess, onCancel }: AlertRuleFormProps) {
  const isEditing = Boolean(ruleId);
  const { createRule, loading: creating } = useCreateAlertRule();
  const { updateRule, loading: updating } = useUpdateAlertRule();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AlertRuleFormData>({
    resolver: zodResolver(alertRuleFormSchema),
    defaultValues: initialData || defaultAlertRule,
  });

  const conditions = watch('conditions') || [];
  const selectedChannels = watch('channels') || [];
  const severity = watch('severity');

  const onSubmit = async (data: AlertRuleFormData) => {
    try {
      setError(null);
      if (isEditing && ruleId) {
        await updateRule(ruleId, data);
      } else {
        await createRule(data);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save alert rule');
    }
  };

  const addCondition = () => {
    setValue('conditions', [
      ...conditions,
      { field: '', operator: 'EQUALS', value: '' },
    ]);
  };

  const removeCondition = (index: number) => {
    setValue(
      'conditions',
      conditions.filter((_, i) => i !== index)
    );
  };

  const toggleChannel = (channel: string) => {
    const updated = selectedChannels.includes(channel)
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel];
    setValue('channels', updated);
  };

  const loading = creating || updating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">
          {isEditing ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure alerts for router events and system conditions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Rule Name *
          </label>
          <input
            {...register('name')}
            id="name"
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., High CPU Alert"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
            placeholder="Optional description of this alert rule"
          />
        </div>

        <div>
          <label htmlFor="eventType" className="block text-sm font-medium mb-2">
            Event Type *
          </label>
          <input
            {...register('eventType')}
            id="eventType"
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            placeholder="e.g., device.cpu.high"
          />
          {errors.eventType && (
            <p className="text-sm text-destructive mt-1">{errors.eventType.message}</p>
          )}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium mb-2">Severity *</label>
        <div className="flex gap-3">
          {Object.entries(severityConfig).map(([key, config]) => (
            <label
              key={key}
              className={`flex-1 p-3 border-2 rounded-md cursor-pointer transition-colors ${
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
              <div className="text-xs text-muted-foreground mt-1">
                {config.description}
              </div>
            </label>
          ))}
        </div>
        {errors.severity && (
          <p className="text-sm text-destructive mt-1">{errors.severity.message}</p>
        )}
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-sm font-medium mb-2">Conditions *</label>
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                {...register(`conditions.${index}.field`)}
                placeholder="Field"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <select
                {...register(`conditions.${index}.operator`)}
                className="w-32 px-3 py-2 border rounded-md"
              >
                {Object.entries(operatorConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <input
                {...register(`conditions.${index}.value`)}
                placeholder="Value"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              {conditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCondition}
          className="mt-2 text-sm text-primary hover:underline"
        >
          + Add Condition
        </button>
        {errors.conditions && (
          <p className="text-sm text-destructive mt-1">{errors.conditions.message}</p>
        )}
      </div>

      {/* Channels */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Notification Channels *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {notificationChannels.map((channel) => (
            <label
              key={channel.value}
              className={`flex items-center gap-2 p-3 border-2 rounded-md cursor-pointer transition-colors ${
                selectedChannels.includes(channel.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedChannels.includes(channel.value)}
                onChange={() => toggleChannel(channel.value)}
                className="rounded"
              />
              <span className="text-sm font-medium">{channel.label}</span>
            </label>
          ))}
        </div>
        {errors.channels && (
          <p className="text-sm text-destructive mt-1">{errors.channels.message}</p>
        )}
      </div>

      {/* Enabled Toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input {...register('enabled')} type="checkbox" className="rounded" />
          <span className="text-sm font-medium">Enable this rule immediately</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-muted"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={loading || !isDirty}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}
