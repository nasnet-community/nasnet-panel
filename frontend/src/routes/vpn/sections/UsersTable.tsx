import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable } from '@nasnet/ui';
import { Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import type { VPNUserResponse } from '../../../api';

interface Props {
  rows: VPNUserResponse[];
  totalRows: number;
  onEdit?: (user: VPNUserResponse) => void;
  onDelete?: (user: VPNUserResponse) => void;
  canMutate?: boolean;
}

export function UsersTable({ rows, totalRows, onEdit, onDelete, canMutate = false }: Props) {
  const { t } = useTranslation('vpn');
  return (
    <DataTable
      columns={[
        { key: 'name', header: t('shared.name'), render: (u: VPNUserResponse) => u.name },
        {
          key: 'profile',
          header: t('users.table.profile'),
          render: (u: VPNUserResponse) => <Badge tone="info">{u.profile}</Badge>,
        },
        {
          key: 'status',
          header: t('shared.status'),
          render: (u: VPNUserResponse) => (
            <Badge tone={u.disabled ? 'neutral' : 'success'}>
              {u.disabled ? t('shared.disabled') : t('shared.enabled')}
            </Badge>
          ),
        },
        {
          key: 'comment',
          header: t('shared.comment'),
          render: (u: VPNUserResponse) => u.comment || '–',
        },
        {
          key: 'actions',
          header: t('shared.actions'),
          render: (u: VPNUserResponse) => (
            <span style={{ display: 'inline-flex', gap: 8 }}>
              {onEdit ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canMutate}
                  title={t('shared.editNamed', { name: u.name })}
                  aria-label={t('shared.editNamed', { name: u.name })}
                  onClick={() => onEdit(u)}
                >
                  <Pencil size={14} aria-hidden />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!canMutate}
                  title={t('shared.deleteNamed', { name: u.name })}
                  aria-label={t('shared.deleteNamed', { name: u.name })}
                  onClick={() => onDelete(u)}
                >
                  <Trash2 size={14} aria-hidden />
                </Button>
              ) : null}
            </span>
          ),
          width: '120px',
        },
      ]}
      rows={rows}
      rowKey={(u) => u.id}
      emptyMessage={totalRows ? t('users.table.noMatch') : t('users.table.empty')}
      emptyIcon={<UsersIcon size={32} aria-hidden />}
    />
  );
}
