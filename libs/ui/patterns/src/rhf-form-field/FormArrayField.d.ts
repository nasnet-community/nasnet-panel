/**
 * FormArrayField Component
 *
 * Dynamic array field handling for React Hook Form.
 * Supports adding, removing, and reordering array items.
 *
 * @module @nasnet/ui/patterns/rhf-form-field
 */
import { type FieldValues, type ArrayPath, type FieldArray } from 'react-hook-form';
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
export declare function FormArrayField<TFieldValues extends FieldValues = FieldValues>({ name, label, description, defaultItem, maxItems, minItems, addButtonText, renderItem, className, emptyMessage, }: FormArrayFieldProps<TFieldValues>): import("react/jsx-runtime").JSX.Element;
export declare namespace FormArrayField {
    var displayName: string;
}
//# sourceMappingURL=FormArrayField.d.ts.map