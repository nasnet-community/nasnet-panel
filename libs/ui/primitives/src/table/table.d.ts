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
import * as React from 'react';
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
/**
 * Table Root Component
 *
 * The main table container with horizontal scroll support and border.
 * Wraps the semantic `<table>` element with overflow handling.
 *
 * @param className - Additional CSS classes to apply
 * @param props - Standard HTML table attributes
 */
declare const Table: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>>;
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
declare const TableHeader: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableSectionProps & React.RefAttributes<HTMLTableSectionElement>>>;
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
declare const TableBody: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableSectionProps & React.RefAttributes<HTMLTableSectionElement>>>;
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
declare const TableFooter: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableSectionProps & React.RefAttributes<HTMLTableSectionElement>>>;
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
declare const TableRow: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>>;
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
declare const TableHead: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableCellElement>>>;
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
declare const TableCell: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>>;
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
declare const TableCaption: React.MemoExoticComponent<React.ForwardRefExoticComponent<TableCaptionProps & React.RefAttributes<HTMLTableCaptionElement>>>;
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, };
//# sourceMappingURL=table.d.ts.map