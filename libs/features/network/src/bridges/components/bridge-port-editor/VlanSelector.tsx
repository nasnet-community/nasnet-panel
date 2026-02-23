import { memo, useState, useCallback, useMemo } from 'react';
import { Input, Button, Badge, Icon } from '@nasnet/ui/primitives';
import { Plus, X } from 'lucide-react';

export interface VlanSelectorProps {
  label: string;
  description?: string;
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * VLAN Selector Component - Multi-select for VLAN IDs
 * Allows adding VLAN IDs (1-4094) with visual chips
 *
 * @description Multi-select VLAN ID picker with validation and visual feedback
 */
export const VlanSelector = memo(function VlanSelector({
  label,
  description,
  value,
  onChange,
  placeholder = 'Enter VLAN ID (1-4094)',
  disabled = false,
  className,
}: VlanSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Memoized add handler
  const handleAdd = useCallback(() => {
    const vlanId = parseInt(inputValue);

    // Validation
    if (!inputValue) {
      return;
    }

    if (isNaN(vlanId)) {
      setError('VLAN ID must be a number');
      return;
    }

    if (vlanId < 1 || vlanId > 4094) {
      setError('VLAN ID must be between 1 and 4094');
      return;
    }

    if (value.includes(vlanId)) {
      setError('VLAN ID already added');
      return;
    }

    // Add VLAN ID
    onChange([...value, vlanId].sort((a, b) => a - b));
    setInputValue('');
    setError(null);
  }, [inputValue, value, onChange]);

  // Memoized remove handler
  const handleRemove = useCallback((vlanId: number) => {
    onChange(value.filter((id) => id !== vlanId));
  }, [value, onChange]);

  // Memoized key down handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  // Memoize sorted VLAN list to prevent unnecessary re-renders
  const sortedVlans = useMemo(() => [...value].sort((a, b) => a - b), [value]);

  return (
    <div className={className || 'space-y-2'}>
      {/* Label */}
      <div>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* Input with Add Button */}
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          max={4094}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          aria-label={`Add ${label}`}
          aria-invalid={!!error}
          aria-describedby={error ? 'vlan-error' : undefined}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleAdd}
          disabled={disabled || !inputValue}
          aria-label="Add VLAN ID"
        >
          <Icon icon={Plus} className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p id="vlan-error" className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Selected VLANs (Chips) */}
      {sortedVlans.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-muted/50">
          {sortedVlans.map((vlanId) => (
            <Badge key={vlanId} variant="secondary" className="gap-1 pr-1">
              <span className="font-mono">{vlanId}</span>
              <button
                type="button"
                onClick={() => handleRemove(vlanId)}
                disabled={disabled}
                className="rounded-sm hover:bg-secondary-foreground/20 transition-colors"
                aria-label={`Remove VLAN ${vlanId}`}
              >
                <Icon icon={X} className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedVlans.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No VLANs selected</p>
      )}
    </div>
  );
});

VlanSelector.displayName = 'VlanSelector';
