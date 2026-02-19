/**
 * DataTableToolbar Component
 *
 * Toolbar container for DataTable filtering, search, and actions.
 * Provides consistent spacing and layout for table controls.
 *
 * @module @nasnet/ui/patterns/data-table-toolbar
 */

import { cn } from '@nasnet/ui/primitives';

export interface DataTableToolbarProps {
  /** Toolbar content (search, filters, actions) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DataTableToolbar - Toolbar container for DataTable controls
 *
 * Provides a consistent layout container for table search, filters, and actions.
 * Typically used above a DataTable component.
 *
 * @example
 * ```tsx
 * <DataTableToolbar>
 *   <div className="flex flex-1 items-center gap-2">
 *     <Input placeholder="Search..." />
 *     <Select>...</Select>
 *   </div>
 *   <div className="flex items-center gap-2">
 *     <Button>Add Item</Button>
 *   </div>
 * </DataTableToolbar>
 * ```
 */
export function DataTableToolbar({
  children,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Table controls"
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

DataTableToolbar.displayName = 'DataTableToolbar';
