/**
 * TemplateVariableEditor Component
 *
 * Form component for editing template variables with type-specific validation.
 * Integrates with React Hook Form.
 */


import { Controller, type UseFormReturn } from 'react-hook-form';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@nasnet/ui/primitives';

import type {
  TemplateVariable,
  TemplateVariableValues,
  VariableType,
} from './template-preview.types';

export interface TemplateVariableEditorProps {
  /** Template variables to edit */
  variables: TemplateVariable[];

  /** React Hook Form instance */
  form: UseFormReturn<TemplateVariableValues>;

  /** Whether the form is disabled */
  disabled?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Get input type for variable type
 */
function getInputType(variableType: VariableType): string {
  switch (variableType) {
    case 'PORT':
    case 'VLAN_ID':
      return 'number';
    default:
      return 'text';
  }
}

/**
 * Get placeholder text for variable type
 */
function getPlaceholder(variable: TemplateVariable): string {
  switch (variable.type) {
    case 'STRING':
      return 'Enter value...';
    case 'INTERFACE':
      return variable.options ? 'Select interface...' : 'e.g., ether1';
    case 'SUBNET':
      return 'e.g., 192.168.1.0/24';
    case 'IP':
      return 'e.g., 192.168.1.1';
    case 'PORT':
      return 'e.g., 8080';
    case 'VLAN_ID':
      return 'e.g., 10';
    default:
      return 'Enter value...';
  }
}

/**
 * Get help text for variable type
 */
function getHelpText(variableType: VariableType): string {
  switch (variableType) {
    case 'STRING':
      return 'Maximum 64 characters';
    case 'INTERFACE':
      return 'RouterOS interface name';
    case 'SUBNET':
      return 'CIDR notation (e.g., 192.168.1.0/24)';
    case 'IP':
      return 'IPv4 address format';
    case 'PORT':
      return 'Port number (1-65535)';
    case 'VLAN_ID':
      return 'VLAN ID (1-4094)';
    default:
      return '';
  }
}

/**
 * Variable input field
 */
interface VariableFieldProps {
  variable: TemplateVariable;
  form: UseFormReturn<TemplateVariableValues>;
  disabled?: boolean;
}

function VariableField({ variable, form, disabled }: VariableFieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const error = errors[variable.name];
  const hasError = !!error;

  // Use dropdown for INTERFACE with options
  if (variable.type === 'INTERFACE' && variable.options && variable.options.length > 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor={variable.name}>
          {variable.label}
          {variable.required && <span className="text-destructive ml-1">*</span>}
        </Label>

        <Controller
          name={variable.name}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={variable.name}
                className={cn(hasError && 'border-destructive')}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${variable.name}-error` : undefined}
              >
                <SelectValue placeholder={getPlaceholder(variable)} />
              </SelectTrigger>
              <SelectContent>
                {variable.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {variable.description && (
          <p className="text-xs text-muted-foreground">{variable.description}</p>
        )}

        {hasError && (
          <p id={`${variable.name}-error`} className="text-xs text-destructive">
            {error.message as string}
          </p>
        )}
      </div>
    );
  }

  // Default input field
  return (
    <div className="space-y-2">
      <Label htmlFor={variable.name}>
        {variable.label}
        {variable.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Input
        id={variable.name}
        type={getInputType(variable.type)}
        placeholder={getPlaceholder(variable)}
        {...register(variable.name)}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${variable.name}-error` : undefined}
        className={cn(
          'font-mono',
          hasError && 'border-destructive focus-visible:ring-destructive'
        )}
      />

      {variable.description && !hasError && (
        <p className="text-xs text-muted-foreground">{variable.description}</p>
      )}

      {hasError && (
        <p id={`${variable.name}-error`} className="text-xs text-destructive">
          {error.message as string}
        </p>
      )}

      {!hasError && !variable.description && (
        <p className="text-xs text-muted-foreground">{getHelpText(variable.type)}</p>
      )}
    </div>
  );
}

/**
 * Template Variable Editor
 *
 * Form for editing template variables with validation.
 * Groups variables and provides type-specific inputs.
 *
 * Features:
 * - Type-specific validation (IP, SUBNET, PORT, VLAN_ID, etc.)
 * - Dropdown for INTERFACE variables with options
 * - Real-time validation feedback
 * - Required field indicators
 * - Help text and descriptions
 */
export function TemplateVariableEditor({
  variables,
  form,
  disabled = false,
  className,
}: TemplateVariableEditorProps) {
  if (variables.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No variables required for this template.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {variables.map((variable) => (
        <VariableField
          key={variable.name}
          variable={variable}
          form={form}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
