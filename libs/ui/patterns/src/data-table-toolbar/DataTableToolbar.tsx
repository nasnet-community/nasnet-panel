/**
 * DataTableToolbar Component
 *
 * Toolbar container for DataTable filtering, search, and actions.
 * Provides consistent spacing and layout for table controls.
 *
 * @module @nasnet/ui/patterns/data-table-toolbar
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

/**
 * Props for DataTableToolbar component
 */
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
 * Features:
 * - Flex layout with justified spacing
 * - Role="toolbar" for accessibility
 * - Responsive padding and gap
 * - Semantic design token colors
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
const DataTableToolbarInner = React.forwardRef<
  HTMLDivElement,
  DataTableToolbarProps
>(({ children, className }, ref) => (
  <div
    ref={ref}
    role="toolbar"
    aria-label="Table controls"
    className={cn(
      'flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4',
      className
    )}
  >
    {children}
  </div>
));

DataTableToolbarInner.displayName = 'DataTableToolbar';

const DataTableToolbar = React.memo(DataTableToolbarInner);
DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
