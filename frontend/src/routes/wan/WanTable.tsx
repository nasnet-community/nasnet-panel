import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, DataTable, Switch } from '@nasnet/ui';
import styles from './WanPage.module.scss';

interface Props<T> {
  rows: T[];
  rowKey: (row: T) => string;
  name: (row: T) => string;
  tag: (row: T) => string;
  detail: (row: T) => string;
  enabled: (row: T) => boolean;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  onToggle: (row: T, enabled: boolean) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}

export function WanTable<T>({
  rows,
  rowKey,
  name,
  tag,
  detail,
  enabled,
  emptyIcon,
  emptyMessage,
  onToggle,
  onEdit,
  onDelete,
}: Props<T>) {
  return (
    <DataTable<T>
      rows={rows}
      rowKey={rowKey}
      emptyIcon={emptyIcon}
      emptyMessage={emptyMessage}
      columns={[
        { key: 'name', header: 'Name', render: (r) => name(r) },
        {
          key: 'tag',
          header: 'Type',
          render: (r) => <Badge tone="primary">{tag(r)}</Badge>,
        },
        { key: 'detail', header: 'Detail', render: (r) => detail(r) },
        {
          key: 'status',
          header: 'Enabled',
          render: (r) => (
            <Switch
              checked={enabled(r)}
              onChange={(e) => onToggle(r, e.target.checked)}
              aria-label={`toggle ${name(r)}`}
            />
          ),
        },
        {
          key: 'actions',
          header: '',
          render: (r) => (
            <span className={styles.rowActions}>
              <Button
                size="sm"
                variant="secondary"
                className={styles.iconBtn}
                title={`Edit ${name(r)}`}
                aria-label={`edit ${name(r)}`}
                onClick={() => onEdit(r)}
              >
                <Pencil size={14} aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="danger"
                className={styles.iconBtn}
                title={`Delete ${name(r)}`}
                aria-label={`delete ${name(r)}`}
                onClick={() => onDelete(r)}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            </span>
          ),
        },
      ]}
    />
  );
}
