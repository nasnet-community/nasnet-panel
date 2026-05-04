import { useState } from 'react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  addL2TPClient,
  deleteL2TPClient,
  updateL2TPClient,
  type AddL2TPClientRequest,
  type UpdateL2TPClientRequest,
  type VPNClient,
  type VPNCredentials,
} from '../../../api';
import { AddVpnClientDialog } from '../dialogs/AddVpnClientDialog';
import { EditL2tpClientDialog } from '../dialogs/EditL2tpClientDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { ClientsTable } from './ClientsTable';
import { SectionHeader } from './SectionHeader';

const matches = (c: VPNClient, q: string) =>
  c.name.toLowerCase().includes(q) ||
  (c.endpoint ?? '').toLowerCase().includes(q) ||
  (c.username ?? '').toLowerCase().includes(q) ||
  (c.comment ?? '').toLowerCase().includes(q);

interface Props {
  creds: VPNCredentials | null;
  clients: VPNClient[];
  onChanged: () => void;
}

export function ClientsSection({ creds, clients, onChanged }: Props) {
  const paged = usePagedFilter(clients, matches);
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<VPNClient | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VPNClient | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const onSubmitL2TP = async (req: AddL2TPClientRequest) => {
    if (!creds) {
      toast.notify({ title: 'Not connected to router', tone: 'danger' });
      return;
    }
    try {
      await addL2TPClient(creds, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add L2TP client.';
      toast.notify({ title: 'Failed to add VPN client', description: message, tone: 'danger' });
      throw err;
    }
    setAdding(false);
    toast.notify({ title: `L2TP client "${req.name}" added`, tone: 'success' });
    onChanged();
  };

  const onSubmitEdit = async (req: UpdateL2TPClientRequest) => {
    if (!creds || !editing) {
      toast.notify({ title: 'Not connected to router', tone: 'danger' });
      return;
    }
    const target = editing;
    try {
      await updateL2TPClient(creds, target.id, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update L2TP client.';
      toast.notify({
        title: 'Failed to update L2TP client',
        description: message,
        tone: 'danger',
      });
      throw err;
    }
    setEditing(null);
    toast.notify({ title: `L2TP client "${target.name}" updated`, tone: 'success' });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await deleteL2TPClient(creds, target.id);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete L2TP client.';
      toast.notify({
        title: 'Failed to delete L2TP client',
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `L2TP client "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="VPN Clients"
          count={clients.length}
          description="Outbound VPN interfaces (WireGuard, L2TP, OpenVPN, PPTP, SSTP, IKEv2)."
          search={{
            value: paged.search,
            placeholder: 'Search clients…',
            ariaLabel: 'Search clients',
            onChange: paged.setSearch,
          }}
          action={{
            label: 'Add client',
            disabled: !creds,
            onClick: () => setAdding(true),
          }}
        />
        <div style={{ marginTop: 16 }}>
          <ClientsTable
            rows={paged.pagedRows}
            totalRows={clients.length}
            creds={creds}
            onToggled={onChanged}
            onEdit={(c) => setEditing(c)}
            onDelete={(c) => setPendingDelete(c)}
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
        <AddVpnClientDialog onCancel={() => setAdding(false)} onSubmitL2TP={onSubmitL2TP} />
      ) : null}
      {editing ? (
        <EditL2tpClientDialog
          clientName={editing.name}
          creds={creds}
          onCancel={() => setEditing(null)}
          onSubmit={onSubmitEdit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete L2TP client"
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
