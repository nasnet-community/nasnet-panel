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
  onToggle?: (row: T, enabled: boolean) => void;
  onEdit?: (row: T) => void;
  editLabel?: (row: T) => string;
  onDelete?: (row: T) => void;
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
  editLabel,
  onDelete,
}: Props<T>) {
  const showActions = !!onEdit || !!onDelete;
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
          render: (r) =>
            onToggle ? (
              <Switch
                checked={enabled(r)}
                onChange={(e) => onToggle(r, e.target.checked)}
                aria-label={`toggle ${name(r)}`}
              />
            ) : (
              <Badge tone={enabled(r) ? 'success' : 'neutral'}>
                {enabled(r) ? 'enabled' : 'disabled'}
              </Badge>
            ),
        },
        ...(showActions
          ? [
              {
                key: 'actions',
                header: '',
                render: (r: T) => (
                  <span className={styles.rowActions}>
                    {onEdit ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className={styles.iconBtn}
                        title={editLabel ? editLabel(r) : `Edit ${name(r)}`}
                        aria-label={editLabel ? editLabel(r) : `edit ${name(r)}`}
                        onClick={() => onEdit(r)}
                      >
                        <Pencil size={14} aria-hidden />
                      </Button>
                    ) : null}
                    {onDelete ? (
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
                    ) : null}
                  </span>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
