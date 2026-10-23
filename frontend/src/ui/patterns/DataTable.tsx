import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import styles from './DataTable.module.scss';
import { sortRows, type SortDirection, type SortState, type SortValue } from './sortRows';

export type { SortDirection, SortState, SortValue } from './sortRows';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  /**
   * Value the column sorts by. Defaults to the row property named by `key`.
   * Numbers sort by value, text alphabetically, and empty values go last.
   */
  sortValue?: (row: T) => SortValue;
  /** Set to false for columns that hold buttons or toggles. Defaults to true. */
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  caption?: string;
  selectedId?: string | null;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

const ARIA_SORT: Record<SortDirection, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

function columnValue<T>(column: DataTableColumn<T>, row: T): SortValue {
  if (column.sortValue) return column.sortValue(row);
  const raw = (row as Record<string, unknown>)[column.key];
  return typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
    ? raw
    : raw === null || raw === undefined
      ? null
      : String(raw);
}

const isSortable = <T,>(column: DataTableColumn<T>) =>
  column.sortable !== false && column.header !== '';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage,
  emptyIcon,
  caption,
  selectedId,
}: DataTableProps<T>): React.ReactElement {
  const { t } = useTranslation('ui');
  const [sort, setSort] = useState<SortState | null>(null);

  const sortColumn = sort ? columns.find((c) => c.key === sort.key) : undefined;
  const sortedRows = useMemo(() => {
    if (!sort || !sortColumn || !isSortable(sortColumn)) return rows;
    return sortRows(rows, (row) => columnValue(sortColumn, row), sort.direction);
  }, [rows, sort, sortColumn]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev && prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );

  if (rows.length === 0) {
    return (
      <div className={styles.scroll}>
        {caption ? <div className={styles.empty}>{caption}</div> : null}
        <div className={styles.empty}>
          {emptyIcon ? <div className={styles.emptyIcon}>{emptyIcon}</div> : null}
          <div>{emptyMessage ?? t('dataTable.empty')}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        {caption ? <caption style={{ captionSide: 'top', padding: 8 }}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => {
              const sortable = isSortable(c);
              const active = sortable && sort?.key === c.key ? sort.direction : null;
              return (
                <th
                  key={c.key}
                  className={cx(styles.th, sortable && styles.thSortable)}
                  style={c.width ? { width: c.width } : undefined}
                  scope="col"
                  aria-sort={sortable ? (active ? ARIA_SORT[active] : 'none') : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={cx(styles.sortButton, !!active && styles.sortButtonActive)}
                      onClick={() => toggleSort(c.key)}
                      title={t('dataTable.sortBy', { column: c.header })}
                    >
                      <span>{c.header}</span>
                      <span className={styles.sortIcon} aria-hidden>
                        {active === 'asc' ? (
                          <ArrowUp size={12} strokeWidth={2.25} />
                        ) : active === 'desc' ? (
                          <ArrowDown size={12} strokeWidth={2.25} />
                        ) : (
                          <ArrowUpDown size={12} strokeWidth={2} />
                        )}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const key = rowKey(row);
            const selected = selectedId === key;
            return (
              <tr
                key={key}
                className={cx(
                  styles.tr,
                  onRowClick && styles.trClickable,
                  selected && styles.trSelected,
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={styles.td}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
