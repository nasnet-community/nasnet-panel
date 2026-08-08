import React from 'react';
import { ArrowUpDown, Trash2 } from 'lucide-react';
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
  onMove?: (row: T) => void;
  moveLabel?: (row: T) => string;
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
  onMove,
  moveLabel,
  onDelete,
}: Props<T>) {
  const showActions = !!onMove || !!onDelete;
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
                    {onMove ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className={styles.iconBtn}
                        title={moveLabel ? moveLabel(r) : `Move ${name(r)}`}
                        aria-label={moveLabel ? moveLabel(r) : `move ${name(r)}`}
                        onClick={() => onMove(r)}
                      >
                        <ArrowUpDown size={14} aria-hidden />
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
