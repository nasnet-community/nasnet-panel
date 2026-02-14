/**
 * VariablesStep Component
 *
 * First step of template installation wizard.
 * Dynamic form generated from template.configVariables.
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';

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
}

/**
 * Build Zod schema from template variables
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
          schema = z.enum(variable.enumValues as [string, ...string[]]);
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
export function VariablesStep({
  template,
  variables,
  onVariablesChange,
}: VariablesStepProps) {
  const schema = buildValidationSchema(template.configVariables);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: variables,
    mode: 'onChange',
  });

  // Watch for form changes and propagate up
  useEffect(() => {
    const subscription = form.watch((value) => {
      onVariablesChange(value as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [form, onVariablesChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configure Template Variables</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the configuration values for your template
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-4">
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
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    {variable.type === 'BOOLEAN' ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
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
                          <SelectValue placeholder={`Select ${variable.label}`} />
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
            <div className="text-center py-8 text-muted-foreground">
              <p>This template has no configurable variables</p>
              <p className="text-sm mt-1">Click Next to continue</p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
