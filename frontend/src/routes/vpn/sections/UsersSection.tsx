import { useState } from 'react';
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
            : 'Failed to delete VPN user.';
      toast.notify({
        title: 'Failed to delete user',
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `User "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="VPN Users"
          count={users.length}
          description="Manage credentials shared across all VPN servers."
          search={{
            value: paged.search,
            placeholder: 'Search users…',
            ariaLabel: 'Search users',
            onChange: paged.setSearch,
          }}
          action={{
            label: 'Add user',
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
            toast.notify({ title: 'VPN user created', tone: 'success' });
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
            toast.notify({ title: 'VPN user updated', tone: 'success' });
            onChanged();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete VPN user"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.name}" from this router? This cannot be undone.`
            : undefined
        }
        confirmLabel={deleteSubmitting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => (deleteSubmitting ? undefined : setPendingDelete(null))}
      />
    </Stack>
  );
}
