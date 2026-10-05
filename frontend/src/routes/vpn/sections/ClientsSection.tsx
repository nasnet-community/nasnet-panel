import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  addL2TPClient,
  createWireguardClient,
  deleteL2TPClient,
  deleteWireguardInterface,
  importWireguardConfig,
  updateL2TPClient,
  type AddL2TPClientRequest,
  type CreateWireguardClientRequest,
  type CreateWireguardClientResponse,
  type ImportWireguardConfigRequest,
  type ImportWireguardConfigResponse,
  type UpdateL2TPClientRequest,
  type VPNClient,
  type VPNClientResponse,
  type VPNCredentials,
} from '../../../api';
import { AddVpnClientDialog } from '../dialogs/AddVpnClientDialog';
import { EditL2tpClientDialog } from '../dialogs/EditL2tpClientDialog';
import { EditWgClientDialog } from '../dialogs/EditWgClientDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { summarizeWireguardImport } from '../wgClientSummary';
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
  onClientUpdated: (client: VPNClient) => void;
  onDialogOpenChange?: (open: boolean) => void;
}

export function ClientsSection({
  creds,
  clients,
  onChanged,
  onClientUpdated,
  onDialogOpenChange,
}: Props) {
  const paged = usePagedFilter(clients, matches);
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<VPNClient | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VPNClient | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const dialogOpen = adding || editing !== null || pendingDelete !== null;
  useEffect(() => {
    onDialogOpenChange?.(dialogOpen);
  }, [dialogOpen, onDialogOpenChange]);

  const onSubmitL2TP = async (req: AddL2TPClientRequest) => {
    if (!creds) {
      toast.notify({ title: t('shared.notConnected'), tone: 'danger' });
      return;
    }
    let created: VPNClientResponse;
    try {
      created = await addL2TPClient(creds, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('clients.toast.addL2tpFailedDescription');
      toast.notify({ title: t('clients.toast.addFailed'), description: message, tone: 'danger' });
      throw err;
    }
    setAdding(false);
    toast.notify({ title: t('clients.toast.l2tpAdded', { name: created.name }), tone: 'success' });
    onChanged();
  };

  const onSubmitWireguard = async (req: CreateWireguardClientRequest) => {
    if (!creds) {
      toast.notify({ title: t('shared.notConnected'), tone: 'danger' });
      return;
    }
    let created: CreateWireguardClientResponse;
    try {
      created = await createWireguardClient(creds, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('clients.toast.addWgFailedDescription');
      toast.notify({ title: t('clients.toast.addFailed'), description: message, tone: 'danger' });
      throw err;
    }
    setAdding(false);
    toast.notify({ title: t('clients.toast.wgAdded', { name: created.name }), tone: 'success' });
    onChanged();
  };

  const onSubmitWireguardImport = async (req: ImportWireguardConfigRequest) => {
    if (!creds) {
      toast.notify({ title: t('shared.notConnected'), tone: 'danger' });
      return;
    }
    let imported: ImportWireguardConfigResponse;
    try {
      imported = await importWireguardConfig(creds, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('clients.toast.wgImportFailed');
      toast.notify({
        title: t('clients.toast.wgImportFailedTitle'),
        description: message,
        tone: 'danger',
      });
      throw err;
    }
    setAdding(false);
    toast.notify({
      ...summarizeWireguardImport(imported.interfaceName, imported),
      durationMs: 8000,
    });
    onChanged();
  };

  const onSubmitEdit = async (req: UpdateL2TPClientRequest) => {
    if (!creds || !editing) {
      toast.notify({ title: t('shared.notConnected'), tone: 'danger' });
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
            : t('clients.toast.l2tpUpdateFailedDescription');
      toast.notify({
        title: t('clients.toast.l2tpUpdateFailed'),
        description: message,
        tone: 'danger',
      });
      throw err;
    }
    setEditing(null);
    toast.notify({ title: t('clients.toast.l2tpUpdated', { name: target.name }), tone: 'success' });
    onClientUpdated({
      ...target,
      comment: req.comment ?? target.comment,
      enabled: req.disabled === undefined ? target.enabled : !req.disabled,
    });
  };

  const onConfirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      if (target.protocol === 'wireguard') {
        await deleteWireguardInterface(creds, target.name);
      } else {
        await deleteL2TPClient(creds, target.id);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('clients.toast.deleteFailedDescription');
      toast.notify({
        title: t('clients.toast.deleteFailed'),
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: t('clients.toast.deletedNamed', { name: target.name }), tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t('clients.title')}
          description={t('clients.description')}
          action={{
            label: t('clients.new'),
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
        <AddVpnClientDialog
          onCancel={() => setAdding(false)}
          onSubmitL2TP={onSubmitL2TP}
          onSubmitWireguard={onSubmitWireguard}
          onSubmitWireguardImport={onSubmitWireguardImport}
        />
      ) : null}
      {editing && editing.protocol === 'l2tp' ? (
        <EditL2tpClientDialog
          clientName={editing.name}
          creds={creds}
          onCancel={() => setEditing(null)}
          onSubmit={onSubmitEdit}
        />
      ) : null}
      {editing && editing.protocol === 'wireguard' ? (
        <EditWgClientDialog
          creds={creds}
          client={editing}
          onCancel={() => setEditing(null)}
          onSaved={(changes) => {
            const target = editing;
            setEditing(null);
            toast.notify({
              title: t('clients.toast.wgUpdated', { name: target.name }),
              tone: 'success',
            });
            onClientUpdated({ ...target, comment: changes.comment, enabled: !changes.disabled });
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title={
          pendingDelete?.protocol === 'wireguard'
            ? t('clients.delete.wgTitle')
            : t('clients.delete.l2tpTitle')
        }
        description={
          pendingDelete
            ? pendingDelete.protocol === 'wireguard'
              ? t('clients.delete.wgDescription', { name: pendingDelete.name })
              : t('clients.delete.l2tpDescription', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={deleteSubmitting ? t('shared.deleting') : t('shared.delete')}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => (deleteSubmitting ? undefined : setPendingDelete(null))}
      />
    </Stack>
  );
}
