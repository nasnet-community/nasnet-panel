import React, { useCallback, useId, useState } from 'react';
import { Input, Button, Badge } from '@nasnet/ui/primitives';
import { Plus, X } from 'lucide-react';

/**
 * Props for ArrayField component
 * @interface ArrayFieldProps
 */
export interface ArrayFieldProps {
  /** Array of string values */
  value?: string[];

  /** Callback when array changes */
  onChange?: (value: string[]) => void;

  /** Placeholder text for input field */
  placeholder?: string;

  /** Whether the field is disabled */
  disabled?: boolean;

  /** Regex pattern to validate each item */
  pattern?: string;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Dynamic array field for managing lists of string values
 *
 * Renders an input field with an Add button to build a dynamic array.
 * Each item appears as a dismissible badge. Supports optional regex validation.
 *
 * @example
 * ```tsx
 * <ArrayField
 *   value={servers}
 *   onChange={setServers}
 *   placeholder="Enter server IP and press Enter"
 *   pattern="^[0-9.]+$"
 * />
 * ```
 *
 * @param props - ArrayField component props
 * @returns Rendered array field
 */
export const ArrayField = React.memo(function ArrayField({
  value = [],
  onChange,
  placeholder,
  disabled,
  pattern,
  className,
}: ArrayFieldProps) {
  const errorId = useId();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates and adds a new item to the array
   */
  const handleAdd = useCallback(() => {
    if (!inputValue.trim()) {
      setError('Value cannot be empty');
      return;
    }

    if (pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(inputValue)) {
        setError('Invalid format');
        return;
      }
    }

    onChange?.([...value, inputValue.trim()]);
    setInputValue('');
    setError(null);
  }, [inputValue, onChange, value, pattern]);

  /**
   * Removes item at given index
   */
  const handleRemove = useCallback(
    (index: number) => {
      onChange?.(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  /**
   * Handles Enter key in input
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className={`space-y-component-sm ${className || ''}`}>
      <div className="gap-component-sm flex">
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Enter value and press Enter or click Add'}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          {error && (
            <p
              id={errorId}
              className="text-error mt-1 text-sm"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          aria-label="Add item"
        >
          <Plus
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Button>
      </div>

      {value.length > 0 && (
        <div
          className="gap-component-sm flex flex-wrap"
          role="region"
          aria-label="Array items"
        >
          {value.map((item, index) => (
            <Badge
              key={`${item}-${index}`}
              variant="secondary"
              className="gap-component-xs pr-component-xs bg-category-vpn/10 text-category-vpn"
            >
              <span className="max-w-[200px] truncate font-mono text-xs">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="hover:bg-error/20 focus-visible:ring-ring ml-1 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                aria-label={`Remove ${item}`}
              >
                <X
                  className="h-3 w-3"
                  aria-hidden="true"
                />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});

ArrayField.displayName = 'ArrayField';
