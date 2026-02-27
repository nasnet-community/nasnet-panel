/**
 * FormArrayField Component
 *
 * Dynamic array field handling for React Hook Form.
 * Supports adding, removing, and reordering array items.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */

import { Plus, Trash2 } from 'lucide-react';
import {
  useFieldArray,
  useFormContext,
  type FieldValues,
  type ArrayPath,
  type FieldArray,
} from 'react-hook-form';

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
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm font-semibold">{label}</h3>
          {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultItem)}
          disabled={!canAdd}
          aria-label={`Add ${label.toLowerCase()}`}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <Plus
            className="h-4 w-4"
            aria-hidden="true"
          />
          {addButtonText}
        </Button>
      </div>

      {/* Items */}
      {fields.length > 0 ?
        <div
          className="space-y-3"
          role="list"
          aria-label={label}
        >
          {fields.map((field, index) => (
            <div
              key={field.id}
              role="listitem"
              className={cn(
                'flex items-start gap-2 p-3',
                'bg-muted/30 border-border rounded-lg border',
                'hover:bg-muted/50 transition-colors'
              )}
            >
              {/* Drag handle (if needed) - optional */}
              {/* <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0 mt-0.5" /> */}

              {/* Render item content */}
              <div className="flex-1">
                {renderItem({
                  index,
                  remove: () => remove(index),
                  canRemove,
                  fieldPrefix: `${name}.${index}`,
                })}
              </div>

              {/* Remove button */}
              {canRemove && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-error hover:bg-error-light flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      : /* Empty state */
        <div className="text-muted-foreground py-4 text-center text-sm">{emptyMessage}</div>
      }

      {/* Item count */}
      {fields.length > 0 && maxItems < 100 && (
        <p className="text-muted-foreground text-right text-xs">
          {fields.length} / {maxItems} items
        </p>
      )}
    </div>
  );
}

FormArrayField.displayName = 'FormArrayField';
