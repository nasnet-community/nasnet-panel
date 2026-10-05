import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { ApiError, deleteVPNUser, type VPNCredentials, type VPNUserResponse } from '../../../api';
import { UserFormDialog } from '../dialogs/UserFormDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { UsersTable } from './UsersTable';
import { SectionHeader } from './SectionHeader';

const matches = (u: VPNUserResponse, q: string) =>
  u.name.toLowerCase().includes(q) ||
  u.profile.toLowerCase().includes(q) ||
  (u.comment ?? '').toLowerCase().includes(q);

interface Props {
  creds: VPNCredentials | null;
  users: VPNUserResponse[];
  onChanged: () => void;
}

export function UsersSection({ creds, users, onChanged }: Props) {
  const paged = usePagedFilter(users, matches);
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<VPNUserResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VPNUserResponse | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const onConfirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await deleteVPNUser(creds, target.id);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('users.toast.deleteFailedDescription');
      toast.notify({
        title: t('users.toast.deleteFailed'),
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: t('users.toast.deleted', { name: target.name }), tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t('users.title')}
          count={users.length}
          description={t('users.description')}
          search={{
            value: paged.search,
            placeholder: t('users.searchPlaceholder'),
            ariaLabel: t('users.searchLabel'),
            onChange: paged.setSearch,
          }}
          action={{
            label: t('users.add'),
            disabled: !creds,
            onClick: () => setAdding(true),
          }}
        />
        <div style={{ marginTop: 16 }}>
          <UsersTable
            rows={paged.pagedRows}
            totalRows={users.length}
            onEdit={setEditing}
            onDelete={setPendingDelete}
            canMutate={!!creds}
          />
          <PaginationControls
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.filteredCount}
            pageSize={PAGE_SIZE}
            onPrev={paged.onPrev}
            onNext={paged.onNext}
          />
        </div>
      </Card>
      {adding ? (
        <UserFormDialog
          creds={creds}
          user={null}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            toast.notify({ title: t('users.toast.created'), tone: 'success' });
            onChanged();
          }}
        />
      ) : null}
      {editing ? (
        <UserFormDialog
          creds={creds}
          user={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.notify({ title: t('users.toast.updated'), tone: 'success' });
            onChanged();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title={t('users.deleteTitle')}
        description={
          pendingDelete ? t('users.deleteDescription', { name: pendingDelete.name }) : undefined
        }
        confirmLabel={deleteSubmitting ? t('shared.deleting') : t('shared.delete')}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => (deleteSubmitting ? undefined : setPendingDelete(null))}
      />
    </Stack>
  );
}
