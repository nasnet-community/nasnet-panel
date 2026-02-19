import React, { useId, useState } from 'react';
import { Input, Button, Badge } from '@nasnet/ui/primitives';
import { Plus, X } from 'lucide-react';

export interface ArrayFieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  pattern?: string;
}

/**
 * Array input field for TEXT_ARRAY type
 * Allows adding/removing string items
 */
export const ArrayField = React.memo(function ArrayField({
  value = [],
  onChange,
  placeholder,
  disabled,
  pattern,
}: ArrayFieldProps) {
  const errorId = useId();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
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
  };

  const handleRemove = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
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
              className="mt-1 text-sm text-destructive"
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
          className="min-h-[44px] min-w-[44px]"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          aria-label="Add item"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[200px] truncate">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label={`Remove ${item}`}
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
