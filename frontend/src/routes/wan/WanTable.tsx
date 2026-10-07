import React from 'react';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('internet');
  const showActions = !!onMove || !!onDelete;
  return (
    <DataTable<T>
      rows={rows}
      rowKey={rowKey}
      emptyIcon={emptyIcon}
      emptyMessage={emptyMessage}
      columns={[
        { key: 'name', header: t('wan.table.name'), render: (r) => name(r) },
        {
          key: 'tag',
          header: t('wan.table.type'),
          render: (r) => <Badge tone="primary">{tag(r)}</Badge>,
        },
        { key: 'detail', header: t('wan.table.detail'), render: (r) => detail(r) },
        {
          key: 'status',
          header: t('wan.table.enabled'),
          render: (r) =>
            onToggle ? (
              <Switch
                checked={enabled(r)}
                onChange={(e) => onToggle(r, e.target.checked)}
                aria-label={t('wan.table.toggleAria', { name: name(r) })}
              />
            ) : (
              <Badge tone={enabled(r) ? 'success' : 'neutral'}>
                {enabled(r) ? t('wan.table.statusEnabled') : t('wan.table.statusDisabled')}
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
                        title={
                          moveLabel ? moveLabel(r) : t('wan.table.moveTitle', { name: name(r) })
                        }
                        aria-label={
                          moveLabel ? moveLabel(r) : t('wan.table.moveAria', { name: name(r) })
                        }
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
                        title={t('wan.table.deleteTitle', { name: name(r) })}
                        aria-label={t('wan.table.deleteAria', { name: name(r) })}
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
