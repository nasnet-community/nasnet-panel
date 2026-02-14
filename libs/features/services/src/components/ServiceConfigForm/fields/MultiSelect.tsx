import { useState } from 'react';
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

export interface MultiSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Multi-select dropdown for MULTI_SELECT type
 */
export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  const handleRemove = (optionValue: string) => {
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const getLabel = (optionValue: string) => {
    const option = options.find((opt) =>
      typeof opt === 'string' ? opt === optionValue : opt.value === optionValue
    );
    return typeof option === 'string' ? option : option?.label || optionValue;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {value.length === 0
                ? placeholder || 'Select options'
                : `${value.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="max-h-60 overflow-auto p-1">
            {options.map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isSelected = value.includes(optionValue);

              return (
                <div
                  key={optionValue}
                  className={cn(
                    'flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent',
                    isSelected && 'bg-accent'
                  )}
                  onClick={() => handleToggle(optionValue)}
                >
                  <Checkbox checked={isSelected} />
                  <span className="flex-1">{optionLabel}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {getLabel(v)}
              <button
                type="button"
                onClick={() => handleRemove(v)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {getLabel(v)}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
