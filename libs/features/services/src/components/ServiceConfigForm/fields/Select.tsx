import React, { useCallback, useMemo } from 'react';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';

/**
 * Props for Select field component
 * @interface SelectProps
 */
export interface SelectProps {
  /** Selected value */
  value?: string;

  /** Callback when selection changes */
  onValueChange?: (value: string) => void;

  /** Array of options (strings or {value, label} objects) */
  options: Array<string | { value: string; label: string }>;

  /** Placeholder text when no selection */
  placeholder?: string;

  /** Whether the select is disabled */
  disabled?: boolean;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Select dropdown field for single-choice selection
 *
 * Renders a dropdown using the primitives Select component.
 * Automatically converts string options to {value, label} format.
 *
 * @example
 * ```tsx
 * <Select
 *   value={mode}
 *   onValueChange={setMode}
 *   options={[
 *     { value: 'exit', label: 'Exit relay' },
 *     { value: 'middle', label: 'Middle relay' },
 *   ]}
 *   placeholder="Select mode"
 * />
 * ```
 *
 * @param props - Select component props
 * @returns Rendered select dropdown
 */
export const Select = React.memo(function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: SelectProps) {
  // Memoize normalized options to prevent unnecessary re-renders
  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        value: typeof option === 'string' ? option : option.value,
        label: typeof option === 'string' ? option : option.label,
      })),
    [options]
  );

  // Memoize the change handler
  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  return (
    <SelectPrimitive
      value={value || ''}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map(({ value: optionValue, label: optionLabel }) => (
          <SelectItem
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive>
  );
});

Select.displayName = 'Select';
