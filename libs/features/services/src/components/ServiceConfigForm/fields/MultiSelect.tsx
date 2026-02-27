import React, { useCallback, useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Checkbox,
  Badge,
  cn,
} from '@nasnet/ui/primitives';
import { Check, ChevronsUpDown, X } from 'lucide-react';

/**
 * Props for MultiSelect field component
 * @interface MultiSelectProps
 */
export interface MultiSelectProps {
  /** Array of selected values */
  value?: string[];

  /** Callback when selections change */
  onChange?: (value: string[]) => void;

  /** Array of options (strings or {value, label} objects) */
  options: Array<string | { value: string; label: string }>;

  /** Placeholder text when no selections */
  placeholder?: string;

  /** Whether the multi-select is disabled */
  disabled?: boolean;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Multi-select dropdown field for multiple choice selection
 *
 * Renders a popover with checkboxes for selecting multiple values.
 * Shows selected items as dismissible badges below the trigger.
 *
 * @example
 * ```tsx
 * <MultiSelect
 *   value={countries}
 *   onChange={setCountries}
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'de', label: 'Germany' },
 *   ]}
 *   placeholder="Select countries"
 * />
 * ```
 *
 * @param props - MultiSelect component props
 * @returns Rendered multi-select dropdown
 */
export const MultiSelect = React.memo(function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Memoize normalized options
  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        value: typeof option === 'string' ? option : option.value,
        label: typeof option === 'string' ? option : option.label,
      })),
    [options]
  );

  // Memoize label lookup function
  const getLabel = useCallback(
    (optionValue: string) => {
      const option = normalizedOptions.find((opt) => opt.value === optionValue);
      return option?.label || optionValue;
    },
    [normalizedOptions]
  );

  // Memoize toggle handler
  const handleToggle = useCallback(
    (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange?.(newValue);
    },
    [value, onChange]
  );

  // Memoize remove handler
  const handleRemove = useCallback(
    (optionValue: string) => {
      onChange?.(value.filter((v) => v !== optionValue));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-component-sm">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-label={
              value.length === 0 ? placeholder || 'Select options' : `${value.length} items selected`
            }
            className={cn('w-full justify-between', className)}
            disabled={disabled}
          >
            <span className="truncate">
              {value.length === 0 ? placeholder || 'Select options' : `${value.length} selected`}
            </span>
            <ChevronsUpDown
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="max-h-60 overflow-auto p-component-xs">
            {normalizedOptions.map(({ value: optionValue, label: optionLabel }) => {
              const isSelected = value.includes(optionValue);
              return (
                <div
                  key={optionValue}
                  className={cn(
                    'flex items-center gap-component-xs rounded-sm px-component-sm py-component-sm cursor-pointer hover:bg-accent',
                    isSelected && 'bg-accent'
                  )}
                  onClick={() => handleToggle(optionValue)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(optionValue)}
                  />
                  <span className="flex-1">{optionLabel}</span>
                  {isSelected && <Check className="h-4 w-4" aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-component-xs" role="region" aria-label="Selected items">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="gap-component-xs pr-component-xs bg-category-vpn/10 text-category-vpn">
              <span className="max-w-[200px] truncate">{getLabel(v)}</span>
              <button
                type="button"
                onClick={() => handleRemove(v)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-error/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Remove ${getLabel(v)}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});

MultiSelect.displayName = 'MultiSelect';
