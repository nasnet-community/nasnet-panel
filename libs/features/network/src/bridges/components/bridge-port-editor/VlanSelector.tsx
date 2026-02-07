import { useState } from 'react';
import { Input } from '@nasnet/ui/primitives';
import { Button } from '@nasnet/ui/primitives';
import { Badge } from '@nasnet/ui/primitives';
import { X, Plus } from 'lucide-react';

export interface VlanSelectorProps {
  label: string;
  description?: string;
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * VLAN Selector Component - Multi-select for VLAN IDs
 * Allows adding VLAN IDs (1-4094) with visual chips
 */
export function VlanSelector({
  label,
  description,
  value,
  onChange,
  placeholder = 'Enter VLAN ID (1-4094)',
  disabled = false,
}: VlanSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
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
  };

  const handleRemove = (vlanId: number) => {
    onChange(value.filter((id) => id !== vlanId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
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
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <p id="vlan-error" className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Selected VLANs (Chips) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-muted/50">
          {value.map((vlanId) => (
            <Badge key={vlanId} variant="secondary" className="gap-1 pr-1">
              <span className="font-mono">{vlanId}</span>
              <button
                type="button"
                onClick={() => handleRemove(vlanId)}
                disabled={disabled}
                className="rounded-sm hover:bg-secondary-foreground/20 transition-colors"
                aria-label={`Remove VLAN ${vlanId}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No VLANs selected</p>
      )}
    </div>
  );
}
