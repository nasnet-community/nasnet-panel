/**
 * PrefixSelector Component
 * Dropdown for selecting common CIDR prefix lengths
 *
 * Supports both dropdown selection AND direct numeric input.
 *
 * @example
 * ```tsx
 * <PrefixSelector
 *   value={24}
 *   onChange={(prefix) => console.log(prefix)}
 *   options={COMMON_PREFIX_OPTIONS}
 * />
 * ```
 */

import * as React from 'react';

import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from '@nasnet/ui/primitives';

import type { PrefixSelectorProps, PrefixOption } from './subnet-input.types';

/**
 * Format host count for display
 */
function formatHosts(hosts: number): string {
  if (hosts >= 1000000) {
    return `${(hosts / 1000000).toFixed(1)}M`;
  }
  if (hosts >= 1000) {
    return `${(hosts / 1000).toFixed(0)}K`;
  }
  return hosts.toString();
}

/**
 * PrefixSelector Component
 *
 * Provides a dropdown to select common CIDR prefixes,
 * showing the mask equivalent and host count for each option.
 */
export function PrefixSelector({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel = 'Select subnet prefix',
  className,
}: PrefixSelectorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Update input value when prop changes
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);

  // Handle direct numeric input
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/[^0-9]/g, '');
      setInputValue(newValue);

      const parsed = parseInt(newValue, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 32) {
        onChange(parsed);
      }
    },
    [onChange]
  );

  // Handle blur from input
  const handleInputBlur = React.useCallback(() => {
    setIsEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 32) {
      setInputValue(String(value));
    }
  }, [inputValue, value]);

  // Handle Enter key in input
  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleInputBlur();
        inputRef.current?.blur();
      }
      if (e.key === 'Escape') {
        setInputValue(String(value));
        setIsEditing(false);
        inputRef.current?.blur();
      }
    },
    [handleInputBlur, value]
  );

  // Handle select change
  const handleSelectChange = React.useCallback(
    (newValue: string) => {
      const parsed = parseInt(newValue, 10);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    },
    [onChange]
  );

  // Find current option
  const currentOption = options.find((opt) => opt.prefix === value);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Prefix indicator and direct input */}
      <div className="relative flex items-center">
        <span className="absolute left-2 text-muted-foreground">/</span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsEditing(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          className="w-14 pl-5 pr-1 text-center font-mono"
          aria-label={ariaLabel}
        />
      </div>

      {/* Dropdown for common prefixes */}
      <Select
        value={String(value)}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label="Select common prefix"
        >
          <SelectValue placeholder="Select prefix">
            {currentOption ? (
              <span className="text-sm">
                {currentOption.mask}
                <span className="ml-1 text-muted-foreground">
                  ({formatHosts(currentOption.hosts)} hosts)
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Custom: /{value}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.prefix}
              value={String(option.prefix)}
              className="flex flex-col items-start"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono">/{option.prefix}</span>
                <span className="text-muted-foreground">{option.mask}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatHosts(option.hosts)} hosts - {option.description}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

PrefixSelector.displayName = 'PrefixSelector';
