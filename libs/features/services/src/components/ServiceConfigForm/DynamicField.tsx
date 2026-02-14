import type { UseFormReturn } from 'react-hook-form';
import type { ConfigSchemaField } from '@nasnet/api-client/generated';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
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
 */
export interface DynamicFieldProps {
  /** Field definition from ConfigSchema */
  field: ConfigSchemaField;

  /** React Hook Form instance */
  form: UseFormReturn<any>;

  /** Whether the field is disabled */
  disabled?: boolean;
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
 */
export function DynamicField({ field, form, disabled }: DynamicFieldProps) {
  return (
    <FormField
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {renderFieldInput(field, formField, disabled)}
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Renders the appropriate input component based on field type
 */
function renderFieldInput(
  field: ConfigSchemaField,
  formField: any,
  disabled?: boolean
) {
  const commonProps = {
    ...formField,
    disabled,
    placeholder: field.placeholder || undefined,
  };

  switch (field.type) {
    case 'TEXT':
    case 'EMAIL':
    case 'URL':
    case 'IP_ADDRESS':
    case 'FILE_PATH':
      return (
        <TextField
          {...commonProps}
          type={field.type === 'EMAIL' ? 'email' : 'text'}
          sensitive={field.sensitive}
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
          min={field.min as number | undefined}
          max={field.max as number | undefined}
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
          options={field.options || []}
          value={formField.value}
          onValueChange={formField.onChange}
        />
      );

    case 'MULTI_SELECT':
      return (
        <MultiSelect
          {...commonProps}
          options={field.options || []}
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
          pattern={field.pattern || undefined}
        />
      );

    default:
      // Fallback to text input
      return <TextField {...commonProps} />;
  }
}
