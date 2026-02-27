/**
 * AlertTemplateVariableInputForm Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Form for entering variable values when applying a template.
 * Provides type-specific inputs with validation based on variable constraints.
 */

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Label,
} from '@nasnet/ui/primitives';

import type {
  AlertRuleTemplate,
  AlertRuleTemplateVariable,
} from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Types
// =============================================================================

/**
 * Variable values map
 */
export interface VariableValues {
  [variableName: string]: string | number;
}

/**
 * Props for AlertTemplateVariableInputForm component
 */
export interface AlertTemplateVariableInputFormProps {
  /** @description Template with variables to collect */
  template: AlertRuleTemplate;

  /** @description Callback when form is submitted with variable values */
  onSubmit: (values: VariableValues) => void;

  /** @description Callback when form is cancelled */
  onCancel?: () => void;

  /** @description Whether the form is submitting */
  isSubmitting?: boolean;
}

// =============================================================================
// Schema Generation
// =============================================================================

/**
 * Generate Zod schema for template variables
 */
function generateVariableSchema(variables: AlertRuleTemplateVariable[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const variable of variables) {
    let schema: z.ZodTypeAny;

    switch (variable.type) {
      case 'INTEGER':
      case 'DURATION':
      case 'PERCENTAGE': {
        // Numeric validation
        schema = z.coerce.number({
          required_error: `${variable.label} is required`,
          invalid_type_error: `${variable.label} must be a number`,
        });

        if (variable.min !== undefined) {
          schema = (schema as z.ZodNumber).min(
            variable.min,
            `${variable.label} must be at least ${variable.min}`
          );
        }

        if (variable.max !== undefined) {
          schema = (schema as z.ZodNumber).max(
            variable.max,
            `${variable.label} must be at most ${variable.max}`
          );
        }

        break;
      }

      case 'STRING':
      default: {
        // String validation
        schema = z.string({
          required_error: `${variable.label} is required`,
        });

        if (variable.min !== undefined) {
          schema = (schema as z.ZodString).min(
            variable.min,
            `${variable.label} must be at least ${variable.min} characters`
          );
        }

        if (variable.max !== undefined) {
          schema = (schema as z.ZodString).max(
            variable.max,
            `${variable.label} must be at most ${variable.max} characters`
          );
        }

        break;
      }
    }

    // Make optional if not required
    if (!variable.required) {
      schema = schema.optional();
    }

    shape[variable.name] = schema;
  }

  return z.object(shape);
}

/**
 * Generate default values from template variables
 */
function generateDefaultValues(variables: AlertRuleTemplateVariable[]): VariableValues {
  const defaults: VariableValues = {};

  for (const variable of variables) {
    if (variable.defaultValue) {
      // Convert default value to appropriate type
      if (
        variable.type === 'INTEGER' ||
        variable.type === 'DURATION' ||
        variable.type === 'PERCENTAGE'
      ) {
        defaults[variable.name] = parseInt(variable.defaultValue, 10);
      } else {
        defaults[variable.name] = variable.defaultValue;
      }
    }
  }

  return defaults;
}

// =============================================================================
// Variable Input Components
// =============================================================================

/**
 * Props for VariableInput component
 */
interface VariableInputProps {
  /** @description Variable definition */
  variable: AlertRuleTemplateVariable;
  /** @description Current value */
  value: string | number;
  /** @description Callback when value changes */
  onChange: (value: string | number) => void;
  /** @description Callback when input loses focus */
  onBlur: () => void;
  /** @description Validation error message */
  error?: string;
}

/**
 * VariableInput - Type-specific input field for template variable
 */
const VariableInput = React.memo(function VariableInput({
  variable,
  value,
  onChange,
  onBlur,
  error,
}: VariableInputProps) {
  const inputType = React.useMemo(() => {
    switch (variable.type) {
      case 'INTEGER':
      case 'DURATION':
      case 'PERCENTAGE':
        return 'number';
      default:
        return 'text';
    }
  }, [variable.type]);

  const placeholder = React.useMemo(() => {
    if (variable.defaultValue) {
      return `Default: ${variable.defaultValue}`;
    }
    return variable.description || `Enter ${variable.label.toLowerCase()}`;
  }, [variable]);

  const suffix = React.useMemo(() => {
    if (variable.unit) {
      return variable.unit;
    }
    if (variable.type === 'PERCENTAGE') {
      return '%';
    }
    return null;
  }, [variable]);

  return (
    <div className="relative">
      <Input
        type={inputType}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(inputType === 'number' ? parseFloat(val) : val);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        min={variable.min}
        max={variable.max}
        className={error ? 'border-error' : ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${variable.name}-error` : undefined}
      />
      {suffix && (
        <div className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
          {suffix}
        </div>
      )}
    </div>
  );
});

VariableInput.displayName = 'VariableInput';

// =============================================================================
// Main Component
// =============================================================================

/**
 * AlertTemplateVariableInputForm - Collect variable values for template
 *
 * @description Dynamic form for collecting template variable values with
 * type-specific inputs and real-time validation.
 *
 * @param props - Component props
 * @returns React component
 */
export const AlertTemplateVariableInputForm = React.memo(function AlertTemplateVariableInputForm({
  template,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AlertTemplateVariableInputFormProps) {
  // Generate schema and defaults
  const schema = React.useMemo(
    () => generateVariableSchema(template.variables),
    [template.variables]
  );

  const defaultValues = React.useMemo(
    () => generateDefaultValues(template.variables),
    [template.variables]
  );

  // Initialize form
  const form = useForm<VariableValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  // Show message if no variables
  if (template.variables.length === 0) {
    return (
      <Card>
        <CardContent className="p-component-lg">
          <p className="text-muted-foreground text-center text-sm">
            This template has no configurable variables.
          </p>
          <div className="gap-component-sm mt-component-md flex">
            <Button
              type="button"
              variant="default"
              onClick={() => onSubmit({})}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Applying...' : 'Apply Template'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-component-lg"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configure Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-md">
          {template.variables.map((variable) => (
            <Controller
              key={variable.name}
              control={form.control}
              name={variable.name}
              render={({ field, fieldState }) => (
                <div className="space-y-component-sm">
                  <Label
                    htmlFor={variable.name}
                    className="gap-component-sm flex items-center"
                  >
                    {variable.label}
                    {variable.required && (
                      <Badge
                        variant="error"
                        className="h-5 text-xs"
                      >
                        Required
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="h-5 text-xs"
                    >
                      {variable.type}
                    </Badge>
                  </Label>

                  {variable.description && (
                    <p className="text-muted-foreground text-sm">{variable.description}</p>
                  )}

                  <VariableInput
                    variable={variable}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />

                  {fieldState.error && (
                    <p
                      id={`${variable.name}-error`}
                      className="text-error text-sm font-medium"
                    >
                      {fieldState.error.message}
                    </p>
                  )}

                  {!fieldState.error &&
                    variable.min !== undefined &&
                    variable.max !== undefined && (
                      <p className="text-muted-foreground text-xs">
                        Range: {variable.min} - {variable.max}
                        {variable.unit && ` ${variable.unit}`}
                      </p>
                    )}
                </div>
              )}
            />
          ))}
        </CardContent>
      </Card>

      <div className="gap-component-sm flex">
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          className="min-h-[44px] flex-1"
        >
          {isSubmitting ? 'Applying Template...' : 'Apply Template'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-[44px] flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
});

AlertTemplateVariableInputForm.displayName = 'AlertTemplateVariableInputForm';
