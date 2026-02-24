/**
 * VariablesStep Component
 *
 * First step of template installation wizard.
 * Generates dynamic form from template.configVariables with real-time validation.
 *
 * @example
 * ```tsx
 * <VariablesStep
 *   template={template}
 *   variables={variables}
 *   onVariablesChange={handleVariablesChange}
 * />
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#wizard-steps
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { ServiceTemplate, TemplateVariable } from '@nasnet/api-client/generated';

/**
 * Props for VariablesStep
 */
export interface VariablesStepProps {
  /** Template being installed */
  template: ServiceTemplate;
  /** Current variable values */
  variables: Record<string, unknown>;
  /** Callback when variables change */
  onVariablesChange: (variables: Record<string, unknown>) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Build Zod schema from template variables.
 * Memoized to prevent unnecessary schema recreation.
 *
 * @param variables - Template variables to build schema from
 * @returns Zod validation schema
 */
function buildValidationSchema(variables: readonly TemplateVariable[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const variable of variables) {
    let schema: z.ZodTypeAny;

    switch (variable.type) {
      case 'STRING':
        schema = z.string();
        if (variable.validationPattern) {
          schema = (schema as z.ZodString).regex(
            new RegExp(variable.validationPattern),
            `Invalid format for ${variable.label}`
          );
        }
        break;

      case 'NUMBER':
        schema = z.coerce.number();
        if (variable.minValue !== null && variable.minValue !== undefined) {
          schema = (schema as z.ZodNumber).min(variable.minValue);
        }
        if (variable.maxValue !== null && variable.maxValue !== undefined) {
          schema = (schema as z.ZodNumber).max(variable.maxValue);
        }
        break;

      case 'PORT':
        schema = z.coerce.number().min(1).max(65535);
        break;

      case 'IP':
        schema = z.string().ip({ version: 'v4' });
        break;

      case 'BOOLEAN':
        schema = z.boolean();
        break;

      case 'ENUM':
        if (variable.enumValues && variable.enumValues.length > 0) {
          schema = z.enum([...variable.enumValues] as unknown as [string, ...string[]]);
        } else {
          schema = z.string();
        }
        break;

      default:
        schema = z.string();
    }

    // Make required if specified
    if (variable.required) {
      shape[variable.name] = schema;
    } else {
      shape[variable.name] = schema.optional();
    }
  }

  return z.object(shape);
}

/**
 * VariablesStep - Dynamic form for template configuration
 *
 * Features:
 * - Auto-generated form from template.configVariables
 * - Type-specific inputs (text, number, boolean, enum, IP, port)
 * - Real-time validation with Zod
 * - Required field indicators
 * - Default values
 */
function VariablesStepComponent({
  template,
  variables,
  onVariablesChange,
  className,
}: VariablesStepProps) {
  const { t } = useTranslation('services');

  // Build schema once and memoize
  const schema = useMemo(
    () => buildValidationSchema(template.configVariables),
    [template.configVariables]
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: variables,
    mode: 'onChange',
  });

  // Memoize watch callback to prevent unnecessary re-renders
  const handleFormChange = useCallback(
    (value: unknown) => {
      onVariablesChange(value as Record<string, unknown>);
    },
    [onVariablesChange]
  );

  // Watch for form changes and propagate up
  useEffect(() => {
    const subscription = form.watch(handleFormChange);
    return () => subscription.unsubscribe();
  }, [form, handleFormChange]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <div>
        <h2 className="text-lg font-semibold">
          {t('wizard.configureVariables', 'Configure Template Variables')}
        </h2>
        <p className="text-sm text-muted-foreground mt-component-sm">
          {t('wizard.configureVariablesDesc', 'Fill in the configuration values for your template')}
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-component-md">
          {template.configVariables.map((variable) => (
            <FormField
              key={variable.name}
              control={form.control}
              name={variable.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {variable.label}
                    {variable.required && (
                      <span className="text-error ml-1" aria-label="required">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    {variable.type === 'BOOLEAN' ? (
                      <div className="flex items-center space-x-component-sm">
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <span className="text-sm">
                          {field.value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ) : variable.type === 'ENUM' && variable.enumValues ? (
                      <Select
                        value={field.value as string}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.selectPlaceholder', `Select ${variable.label}`)} />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.enumValues.map((value) => (
                            <SelectItem key={String(value)} value={String(value)}>
                              {String(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={variable.type === 'NUMBER' || variable.type === 'PORT' ? 'number' : 'text'}
                        placeholder={variable.default ? String(variable.default) : ''}
                        {...field}
                        value={field.value as string | number}
                        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    )}
                  </FormControl>
                  {variable.description && (
                    <FormDescription>{variable.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {template.configVariables.length === 0 && (
            <div className="text-center py-component-lg text-muted-foreground">
              <p>{t('wizard.noVariables', 'This template has no configurable variables')}</p>
              <p className="text-sm mt-component-sm">{t('wizard.clickNext', 'Click Next to continue')}</p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

export const VariablesStep = React.memo(VariablesStepComponent);
VariablesStep.displayName = 'VariablesStep';
