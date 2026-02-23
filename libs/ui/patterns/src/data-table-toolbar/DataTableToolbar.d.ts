/**
 * DataTableToolbar Component
 *
 * Toolbar container for DataTable filtering, search, and actions.
 * Provides consistent spacing and layout for table controls.
 *
 * @module @nasnet/ui/patterns/data-table-toolbar
 */
import * as React from 'react';
/**
 * Props for DataTableToolbar component
 */
export interface DataTableToolbarProps {
    /** Toolbar content (search, filters, actions) */
    children: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}
declare const DataTableToolbar: React.MemoExoticComponent<React.ForwardRefExoticComponent<DataTableToolbarProps & React.RefAttributes<HTMLDivElement>>>;
export { DataTableToolbar };
//# sourceMappingURL=DataTableToolbar.d.ts.map