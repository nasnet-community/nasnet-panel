import { useState } from 'react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  createSstpServer,
  deleteOvpnServer,
  deleteWireguardInterface,
  updateOvpnServerEnabled,
  type VPNCredentials,
  type VPNServer,
} from '../../../api';
import { AddVpnServerDialog } from '../dialogs/AddVpnServerDialog';
import { EditWgInterfaceDialog } from '../dialogs/EditWgInterfaceDialog';
import { ServerDetailsDialog } from '../dialogs/ServerDetailsDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { pollSstpServerTask } from '../sstpTask';
import { PAGE_SIZE } from '../utils';
import { ServersTable } from './ServersTable';
import { SectionHeader } from './SectionHeader';

const matches = (s: VPNServer, q: string) =>
  s.name.toLowerCase().includes(q) ||
  (s.ipPool ?? '').toLowerCase().includes(q) ||
  (s.remoteIp ?? '').toLowerCase().includes(q) ||
  (s.dns ?? '').toLowerCase().includes(q) ||
  String(s.listenPort).includes(q);

interface Props {
  creds: VPNCredentials | null;
  servers: VPNServer[];
  onChanged: () => void;
}

export function ServersSection({ creds, servers, onChanged }: Props) {
  const paged = usePagedFilter(servers, matches);
  const toast = useToast();
  const [selected, setSelected] = useState<VPNServer | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingWg, setEditingWg] = useState<VPNServer | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VPNServer | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<VPNServer | null>(null);
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<VPNServer | null>(null);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);
  const toggleEnable = pendingToggle ? !pendingToggle.running : false;

  const sstpEnabled = servers.some((s) => s.protocol === 'sstp' && s.running);

  const onCreated = () => {
    toast.notify({ title: 'VPN server created', tone: 'success' });
    setAdding(false);
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      if (target.protocol === 'openvpn') {
        await deleteOvpnServer(creds, target.name);
      } else if (target.protocol === 'wireguard') {
        await deleteWireguardInterface(creds, target.name);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete VPN server.';
      toast.notify({
        title: 'Failed to delete server',
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `Server "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  const onConfirmDisable = async () => {
    if (!creds || !pendingDisable) return;
    const target = pendingDisable;
    setDisableSubmitting(true);
    try {
      const res = await createSstpServer(creds, { enabled: false });
      const status = await pollSstpServerTask(creds, res.taskId).done;
      if (status.status !== 'completed') {
        throw new Error(status.error ?? 'SSTP server could not be disabled.');
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to disable SSTP server.';
      toast.notify({
        title: 'Failed to disable server',
        description: message,
        tone: 'danger',
      });
      setDisableSubmitting(false);
      return;
    }
    setDisableSubmitting(false);
    setPendingDisable(null);
    toast.notify({ title: `Server "${target.name}" disabled`, tone: 'info' });
    onChanged();
  };

  const onConfirmToggle = async () => {
    if (!creds || !pendingToggle) return;
    const target = pendingToggle;
    const enable = !target.running;
    setToggleSubmitting(true);
    try {
      await updateOvpnServerEnabled(creds, target.name, { enabled: enable });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : `Failed to ${enable ? 'enable' : 'disable'} OpenVPN server.`;
      toast.notify({
        title: `Failed to ${enable ? 'enable' : 'disable'} server`,
        description: message,
        tone: 'danger',
      });
      setToggleSubmitting(false);
      return;
    }
    setToggleSubmitting(false);
    setPendingToggle(null);
    toast.notify({
      title: `Server "${target.name}" ${enable ? 'enabled' : 'disabled'}`,
      tone: 'info',
    });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="VPN Servers"
          count={servers.length}
          description="Listen for inbound VPN connections."
          search={{
            value: paged.search,
            placeholder: 'Search servers…',
            ariaLabel: 'Search servers',
            onChange: paged.setSearch,
          }}
          action={{
            label: 'Add server',
            disabled: !creds,
            onClick: () => setAdding(true),
          }}
        />
        <div style={{ marginTop: 16 }}>
          <ServersTable
            rows={paged.pagedRows}
            totalRows={servers.length}
            onRowClick={setSelected}
            onEdit={(s) => setEditingWg(s)}
            onDelete={(s) => setPendingDelete(s)}
            onDisable={(s) => setPendingDisable(s)}
            onToggleEnabled={(s) => setPendingToggle(s)}
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
        <AddVpnServerDialog
          creds={creds}
          sstpEnabled={sstpEnabled}
          onCancel={() => setAdding(false)}
          onCreated={onCreated}
        />
      ) : null}
      {editingWg && editingWg.protocol === 'wireguard' ? (
        <EditWgInterfaceDialog
          creds={creds}
          server={editingWg}
          onCancel={() => setEditingWg(null)}
          onSaved={() => {
            setEditingWg(null);
            toast.notify({ title: 'WireGuard server updated', tone: 'success' });
            onChanged();
          }}
        />
      ) : null}
      <ServerDetailsDialog server={selected} creds={creds} onClose={() => setSelected(null)} />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete VPN server"
        description={
          pendingDelete
            ? `Remove "${pendingDelete.name}" from this router? ${
                pendingDelete.protocol === 'openvpn'
                  ? 'Associated users, IP pool, profile and certificates will also be removed.'
                  : 'Associated peers and IP address will also be removed.'
              } This cannot be undone.`
            : undefined
        }
        confirmLabel={deleteSubmitting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => (deleteSubmitting ? undefined : setPendingDelete(null))}
      />
      <ConfirmDialog
        open={!!pendingToggle}
        title={toggleEnable ? 'Enable OpenVPN server' : 'Disable OpenVPN server'}
        description={
          pendingToggle
            ? toggleEnable
              ? `Start "${pendingToggle.name}" on this router? Clients can connect again with their existing profiles.`
              : `Stop "${pendingToggle.name}" on this router? Connected clients are dropped and cannot reconnect until it is enabled again.`
            : undefined
        }
        confirmLabel={
          toggleEnable
            ? toggleSubmitting
              ? 'Enabling…'
              : 'Enable'
            : toggleSubmitting
              ? 'Disabling…'
              : 'Disable'
        }
        destructive={!toggleEnable}
        onConfirm={onConfirmToggle}
        onCancel={() => (toggleSubmitting ? undefined : setPendingToggle(null))}
      />
      <ConfirmDialog
        open={!!pendingDisable}
        title="Disable SSTP server"
        description="Stop the SSTP server on this router? Firewall rules added for it are removed and clients can no longer connect over SSTP. The server certificate is kept, so it can be enabled again later."
        confirmLabel={disableSubmitting ? 'Disabling…' : 'Disable'}
        destructive
        onConfirm={onConfirmDisable}
        onCancel={() => (disableSubmitting ? undefined : setPendingDisable(null))}
      />
    </Stack>
  );
}
