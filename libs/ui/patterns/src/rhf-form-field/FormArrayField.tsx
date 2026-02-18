/**
 * FormArrayField Component
 *
 * Dynamic array field handling for React Hook Form.
 * Supports adding, removing, and reordering array items.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useFieldArray, useFormContext, type FieldValues, type ArrayPath, type FieldArray } from 'react-hook-form';

import { Button, cn } from '@nasnet/ui/primitives';

export interface FormArrayFieldProps<TFieldValues extends FieldValues = FieldValues> {
  /** Field name matching the array in the form schema */
  name: ArrayPath<TFieldValues>;
  /** Label for the array section */
  label: string;
  /** Description/help text */
  description?: string;
  /** Default item to add when clicking "Add" */
  defaultItem: FieldArray<TFieldValues, ArrayPath<TFieldValues>>;
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Minimum number of items required */
  minItems?: number;
  /** Text for the add button */
  addButtonText?: string;
  /** Render function for each item */
  renderItem: (props: {
    index: number;
    remove: () => void;
    canRemove: boolean;
    fieldPrefix: string;
  }) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Dynamic array field component for React Hook Form.
 * Wraps useFieldArray with UI for adding/removing items.
 *
 * @example
 * ```tsx
 * <FormArrayField
 *   name="peers"
 *   label="VPN Peers"
 *   defaultItem={{ publicKey: '', allowedIPs: [] }}
 *   maxItems={10}
 *   renderItem={({ index, remove, canRemove, fieldPrefix }) => (
 *     <>
 *       <RHFFormField name={`${fieldPrefix}.publicKey`} label="Public Key" />
 *       {canRemove && <Button onClick={remove}>Remove</Button>}
 *     </>
 *   )}
 * />
 * ```
 */
export function FormArrayField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  description,
  defaultItem,
  maxItems = 100,
  minItems = 0,
  addButtonText = 'Add',
  renderItem,
  className,
  emptyMessage = 'No items added. Click "Add" to create one.',
}: FormArrayFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const canAdd = fields.length < maxItems;
  const canRemove = fields.length > minItems;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultItem)}
          disabled={!canAdd}
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {addButtonText}
        </Button>
      </div>

      {/* Items */}
      {fields.length > 0 ? (
        <div className="space-y-3" role="list" aria-label={label}>
          {fields.map((field, index) => (
            <div
              key={field.id}
              role="listitem"
              className={cn(
                'relative border border-border rounded-lg p-4',
                'bg-card hover:bg-accent/5 transition-colors'
              )}
            >
              {/* Item number badge */}
              <div className="absolute -top-2 left-3 bg-background px-2 text-xs font-medium text-muted-foreground">
                #{index + 1}
              </div>

              {/* Render item content */}
              {renderItem({
                index,
                remove: () => remove(index),
                canRemove,
                fieldPrefix: `${name}.${index}`,
              })}
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}

      {/* Item count */}
      {fields.length > 0 && maxItems < 100 && (
        <p className="text-xs text-muted-foreground text-right">
          {fields.length} / {maxItems} items
        </p>
      )}
    </div>
  );
}

FormArrayField.displayName = 'FormArrayField';
