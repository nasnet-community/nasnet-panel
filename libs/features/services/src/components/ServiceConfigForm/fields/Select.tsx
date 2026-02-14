import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Select dropdown for SELECT type
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: SelectProps) {
  return (
    <SelectPrimitive value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder || 'Select an option'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </SelectPrimitive>
  );
}
