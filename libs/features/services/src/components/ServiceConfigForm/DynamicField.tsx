import React, { useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ConfigSchemaField } from '@nasnet/api-client/generated';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  cn,
} from '@nasnet/ui/primitives';
import {
  TextField,
  TextArea,
  NumberField,
  Switch,
  Select,
  MultiSelect,
  PasswordField,
  ArrayField,
} from './fields';

/**
 * Props for DynamicField component
 * @interface DynamicFieldProps
 */
export interface DynamicFieldProps {
  /** Field definition from ConfigSchema */
  field: ConfigSchemaField;

  /** React Hook Form instance */
  form: UseFormReturn<any>;

  /** Whether the field is disabled */
  disabled?: boolean;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Dynamic field renderer that selects the appropriate field component
 * based on the ConfigFieldType enum value
 *
 * This component handles all field types defined in the backend:
 * - TEXT, TEXT_AREA, PASSWORD, EMAIL, URL, IP_ADDRESS, FILE_PATH, PORT
 * - NUMBER
 * - TOGGLE
 * - SELECT, MULTI_SELECT
 * - TEXT_ARRAY
 *
 * @example
 * ```tsx
 * {visibleFields.map(field => (
 *   <DynamicField key={field.name} field={field} form={form} />
 * ))}
 * ```
 *
 * @param props - DynamicField component props
 * @returns Rendered form field with appropriate input component
 */
export const DynamicField = React.memo(function DynamicField({
  field,
  form,
  disabled,
  className,
}: DynamicFieldProps) {
  // Memoize rendered input to prevent unnecessary re-renders
  const renderedInput = useMemo(
    () => renderFieldInput(field, form.watch(field.name), disabled),
    [field, form, disabled]
  );

  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {field.label}
            {field.required && (
              <>
                <span className="text-error ml-1" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </>
            )}
          </FormLabel>
          <FormControl>
            {renderFieldInputWithContext(
              field,
              formField,
              disabled,
              !!fieldState.error
            )}
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage role="alert" />
        </FormItem>
      )}
    />
  );
});

DynamicField.displayName = 'DynamicField';

/**
 * Renders the appropriate input component based on field type
 * @internal
 */
function renderFieldInput(
  field: ConfigSchemaField,
  value: any,
  disabled?: boolean
) {
  // This helper determines which component to use
  const fieldType = (field.type as string) || 'TEXT';

  return {
    fieldType,
    value,
    options: (field as any).options || [],
    min: (field as any).min,
    max: (field as any).max,
    pattern: (field as any).pattern,
  };
}

/**
 * Renders the actual input component with form context
 * @internal
 */
function renderFieldInputWithContext(
  field: ConfigSchemaField,
  formField: any,
  disabled?: boolean,
  hasError?: boolean
) {
  const commonProps = {
    ...formField,
    disabled,
    placeholder: field.placeholder || undefined,
    'aria-invalid': hasError || undefined,
  };

  const fieldType = (field.type as string) || 'TEXT';

  switch (fieldType) {
    case 'TEXT':
    case 'EMAIL':
    case 'URL':
    case 'IP':
    case 'PATH':
      return (
        <TextField
          {...commonProps}
          type={fieldType === 'EMAIL' ? 'email' : 'text'}
          sensitive={(field as any).sensitive}
          className={fieldType === 'IP' || fieldType === 'PATH' ? 'font-mono' : ''}
        />
      );

    case 'TEXT_AREA':
      return <TextArea {...commonProps} />;

    case 'PASSWORD':
      return <PasswordField {...commonProps} />;

    case 'NUMBER':
    case 'PORT':
      return (
        <NumberField
          {...commonProps}
          min={(field as any).min as number | undefined}
          max={(field as any).max as number | undefined}
          className="font-mono"
        />
      );

    case 'TOGGLE':
      return (
        <Switch
          checked={formField.value}
          onCheckedChange={formField.onChange}
          disabled={disabled}
        />
      );

    case 'SELECT':
      return (
        <Select
          {...commonProps}
          options={(field as any).options || []}
          value={formField.value}
          onValueChange={formField.onChange}
        />
      );

    case 'MULTI_SELECT':
      return (
        <MultiSelect
          {...commonProps}
          options={(field as any).options || []}
          value={formField.value}
          onChange={formField.onChange}
        />
      );

    case 'TEXT_ARRAY':
      return (
        <ArrayField
          {...commonProps}
          value={formField.value}
          onChange={formField.onChange}
          pattern={(field as any).pattern || undefined}
        />
      );

    default:
      // Fallback to text input
      return <TextField {...commonProps} />;
  }
}
