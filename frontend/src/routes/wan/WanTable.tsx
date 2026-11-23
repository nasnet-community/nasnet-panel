import React from 'react';
import { ArrowUpDown, Pencil, SearchX, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Badge, Button, DataTable, Skeleton } from '@nasnet/ui';
import type { WanResponse } from '../../api';
import styles from './WanPage.module.scss';

interface Props {
  rows: WanResponse[];
  loading?: boolean;
  error?: string | null;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  onEdit?: (row: WanResponse) => void;
  onMove?: (row: WanResponse) => void;
  moveLabel?: (row: WanResponse) => string;
  onFree?: (row: WanResponse) => void;
}

type Tone = React.ComponentProps<typeof Badge>['tone'];

function statusBadge(t: TFunction<'internet'>, row: WanResponse): { tone: Tone; label: string } {
  if (!row.enabled) return { tone: 'neutral', label: t('wan.table.statusDisabled') };
  switch (row.status) {
    case 'link-ok':
    case 'authorized':
      return { tone: 'success', label: t('wan.table.statusUp') };
    case 'connecting':
    case 'scanning':
      return { tone: 'warning', label: t('wan.table.statusConnecting') };
    case 'no-link':
      return { tone: 'danger', label: t('wan.table.statusNoLink') };
    default:
      return { tone: 'neutral', label: t('wan.table.statusUnknown') };
  }
}

export function WanTable({
  rows,
  loading,
  error,
  emptyIcon,
  emptyMessage,
  onEdit,
  onMove,
  moveLabel,
  onFree,
}: Props) {
  const { t } = useTranslation('internet');

  if (loading && rows.length === 0) {
    return (
      <div className={styles.skeletonRows} data-testid="wan-skeleton">
        <Skeleton height={36} />
        <Skeleton height={36} />
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className={styles.errorNote}>
        <SearchX size={28} aria-hidden className={styles.errorIcon} />
        <p>{t('wan.table.loadFailed', { error })}</p>
      </div>
    );
  }

  const showActions = !!onEdit || !!onMove || !!onFree;
  return (
    <DataTable<WanResponse>
      rows={rows}
      rowKey={(r) => r.interface}
      emptyIcon={emptyIcon}
      emptyMessage={emptyMessage}
      columns={[
        {
          key: 'name',
          header: t('wan.table.name'),
          sortValue: (r) => r.interface,
          render: (r) => (
            <span className={styles.nameCell}>
              <span>{r.interface}</span>
              {r.ssid ? <span className={styles.subtle}>{r.ssid}</span> : null}
            </span>
          ),
        },
        {
          key: 'type',
          header: t('wan.table.type'),
          sortValue: (r) => r.interfaceType,
          render: (r) => <Badge tone="primary">{r.interfaceType}</Badge>,
        },
        {
          key: 'address',
          header: t('wan.table.address'),
          sortValue: (r) => r.ip ?? null,
          render: (r) => (
            <span className={styles.address} dir="ltr">
              {r.addressType ? (
                <Badge tone={r.addressType === 'static' ? 'info' : 'neutral'}>
                  {r.addressType === 'static' ? t('wan.table.static') : t('wan.table.dhcp')}
                </Badge>
              ) : null}
              {r.ip || '—'}
            </span>
          ),
        },
        {
          key: 'gateway',
          header: t('wan.table.gateway'),
          sortValue: (r) => r.gateway ?? null,
          render: (r) => <span dir="ltr">{r.gateway || '—'}</span>,
        },
        {
          key: 'status',
          header: t('wan.table.status'),
          sortValue: (r) => (r.enabled ? (r.status ?? '') : null),
          render: (r) => {
            const { tone, label } = statusBadge(t, r);
            return <Badge tone={tone}>{label}</Badge>;
          },
        },
        ...(showActions
          ? [
              {
                key: 'actions',
                header: '',
                sortable: false,
                render: (r: WanResponse) => (
                  <span className={styles.rowActions}>
                    {onEdit ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className={styles.iconBtn}
                        title={t('wan.table.editTitle', { name: r.interface })}
                        aria-label={t('wan.table.editTitle', { name: r.interface })}
                        onClick={() => onEdit(r)}
                      >
                        <Pencil size={14} aria-hidden />
                      </Button>
                    ) : null}
                    {onMove ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className={styles.iconBtn}
                        title={
                          moveLabel ? moveLabel(r) : t('wan.table.moveTitle', { name: r.interface })
                        }
                        aria-label={
                          moveLabel ? moveLabel(r) : t('wan.table.moveAria', { name: r.interface })
                        }
                        onClick={() => onMove(r)}
                      >
                        <ArrowUpDown size={14} aria-hidden />
                      </Button>
                    ) : null}
                    {onFree ? (
                      <Button
                        size="sm"
                        variant="danger"
                        className={styles.iconBtn}
                        title={t('wan.table.freeTitle', { name: r.interface })}
                        aria-label={t('wan.table.freeTitle', { name: r.interface })}
                        onClick={() => onFree(r)}
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
