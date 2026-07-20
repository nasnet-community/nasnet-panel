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
  return (
    <DataTable
      columns={[
        { key: 'name', header: 'Name', render: (u: VPNUserResponse) => u.name },
        {
          key: 'profile',
          header: 'Profile',
          render: (u: VPNUserResponse) => <Badge tone="info">{u.profile}</Badge>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (u: VPNUserResponse) => (
            <Badge tone={u.disabled ? 'neutral' : 'success'}>
              {u.disabled ? 'Disabled' : 'Enabled'}
            </Badge>
          ),
        },
        {
          key: 'comment',
          header: 'Comment',
          render: (u: VPNUserResponse) => u.comment || '–',
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (u: VPNUserResponse) => (
            <span style={{ display: 'inline-flex', gap: 8 }}>
              {onEdit ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canMutate}
                  title={`Edit ${u.name}`}
                  aria-label={`Edit ${u.name}`}
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
                  title={`Delete ${u.name}`}
                  aria-label={`Delete ${u.name}`}
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
      emptyMessage={totalRows ? 'No users match the current filters.' : 'No VPN users configured.'}
      emptyIcon={<UsersIcon size={32} aria-hidden />}
    />
  );
}
