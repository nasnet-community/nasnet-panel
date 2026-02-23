/**
 * Table Component
 *
 * A semantic table component for displaying structured data with headers, rows, and cells.
 * Built with semantic HTML and Tailwind CSS for accessibility and styling.
 *
 * Use Table for:
 * - Displaying data in rows and columns
 * - Firewall rules, DHCP leases, log entries, device lists
 * - Desktop views with column headers and sortable columns
 *
 * For mobile views (card layout), use ResourceCard pattern instead.
 *
 * Accessibility:
 * - Semantic `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<caption>` elements
 * - Use `<TableCaption>` for table description (required for screen readers)
 * - Proper heading hierarchy with `<TableHead>` cells
 * - Support for checkbox columns with proper spacing
 * - Keyboard navigation via Tab
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableCaption>A list of your recent invoices.</TableCaption>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Invoice</TableHead>
 *       <TableHead>Status</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     {data.map(item => (
 *       <TableRow key={item.id}>
 *         <TableCell>{item.invoice}</TableCell>
 *         <TableCell>{item.status}</TableCell>
 *       </TableRow>
 *     ))}
 *   </TableBody>
 * </Table>
 * ```
 *
 * @see https://ui.shadcn.com/docs/components/table
 */

// ============================================================================
// Imports
// ============================================================================

import * as React from 'react';

import { cn } from '../lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the Table component
 */
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Props for table header/body/footer sections
 */
export interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Props for table rows
 */
export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Props for table header cells
 */
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Props for table data cells
 */
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

/**
 * Props for table caption
 */
export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
  /** Additional CSS classes to apply */
  className?: string;
}

// ============================================================================
// Table Root Component
// ============================================================================

/**
 * Table Root Component
 *
 * The main table container with horizontal scroll support and border.
 * Wraps the semantic `<table>` element with overflow handling.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML table attributes
 */
const Table = React.memo(
  React.forwardRef<
    HTMLTableElement,
    TableProps
  >(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-xl border border-border">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  ))
);
Table.displayName = 'Table';

// ============================================================================
// TableHeader Component
// ============================================================================

/**
 * TableHeader Component
 *
 * Semantic `<thead>` element for table headers.
 * Contains TableRow(s) with TableHead cells.
 * Automatically adds bottom border to all child rows.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML thead attributes
 */
const TableHeader = React.memo(
  React.forwardRef<
    HTMLTableSectionElement,
    TableSectionProps
  >(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  ))
);
TableHeader.displayName = 'TableHeader';

// ============================================================================
// TableBody Component
// ============================================================================

/**
 * TableBody Component
 *
 * Semantic `<tbody>` element for table body rows.
 * Contains TableRow(s) with TableCell elements.
 * Automatically removes bottom border from last row.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML tbody attributes
 */
const TableBody = React.memo(
  React.forwardRef<
    HTMLTableSectionElement,
    TableSectionProps
  >(({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  ))
);
TableBody.displayName = 'TableBody';

// ============================================================================
// TableFooter Component
// ============================================================================

/**
 * TableFooter Component
 *
 * Semantic `<tfoot>` element for table footers.
 * Contains TableRow(s) with summary/total information.
 * Styled with muted background to visually distinguish from body.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML tfoot attributes
 */
const TableFooter = React.memo(
  React.forwardRef<
    HTMLTableSectionElement,
    TableSectionProps
  >(({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  ))
);
TableFooter.displayName = 'TableFooter';

// ============================================================================
// TableRow Component
// ============================================================================

/**
 * TableRow Component
 *
 * Semantic `<tr>` element for table rows.
 * Applies hover background and selection state styling.
 * Automatically adds bottom border between rows.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML tr attributes
 */
const TableRow = React.memo(
  React.forwardRef<
    HTMLTableRowElement,
    TableRowProps
  >(({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-all duration-200 hover:bg-muted data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  ))
);
TableRow.displayName = 'TableRow';

// ============================================================================
// TableHead Component
// ============================================================================

/**
 * TableHead Component
 *
 * Semantic `<th>` element for table header cells.
 * Styled with semibold font, muted foreground, and muted background.
 * Includes smart spacing for checkbox columns.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML th attributes
 */
const TableHead = React.memo(
  React.forwardRef<
    HTMLTableCellElement,
    TableHeadProps
  >(({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  ))
);
TableHead.displayName = 'TableHead';

// ============================================================================
// TableCell Component
// ============================================================================

/**
 * TableCell Component
 *
 * Semantic `<td>` element for table data cells.
 * Standard padding and alignment for readability.
 * Includes smart spacing for checkbox columns.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML td attributes
 */
const TableCell = React.memo(
  React.forwardRef<
    HTMLTableCellElement,
    TableCellProps
  >(({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  ))
);
TableCell.displayName = 'TableCell';

// ============================================================================
// TableCaption Component
// ============================================================================

/**
 * TableCaption Component
 *
 * Semantic `<caption>` element for table captions.
 * Provides a descriptive label for the table (important for accessibility).
 * Hidden by default visually but available to screen readers.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML caption attributes
 */
const TableCaption = React.memo(
  React.forwardRef<
    HTMLTableCaptionElement,
    TableCaptionProps
  >(({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  ))
);
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
