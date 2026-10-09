import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Checkbox, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  deleteL2tpServer,
  deleteOvpnServer,
  deleteSstpServer,
  deleteWireguardInterface,
  updateOvpnServerEnabled,
  type VPNCredentials,
  type VPNServer,
} from '../../../api';
import { AddVpnServerDialog } from '../dialogs/AddVpnServerDialog';
import { EditWgInterfaceDialog } from '../dialogs/EditWgInterfaceDialog';
import { ExportOvpnDialog } from '../dialogs/ExportOvpnDialog';
import { ServerDetailsDialog } from '../dialogs/ServerDetailsDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { ServersTable } from './ServersTable';
import { SectionHeader } from './SectionHeader';

const matches = (s: VPNServer, q: string) =>
  s.name.toLowerCase().includes(q) ||
  (s.ipPool ?? '').toLowerCase().includes(q) ||
  (s.remoteIp ?? '').toLowerCase().includes(q) ||
  (s.dns ?? '').toLowerCase().includes(q) ||
  String(s.listenPort).includes(q);

const ovpnPairedServer = (s: VPNServer, all: VPNServer[]) => {
  if (s.protocol !== 'openvpn') return null;
  let paired: string | null = null;
  if (s.name.endsWith('-tcp')) paired = `${s.name.slice(0, -4)}-udp`;
  else if (s.name.endsWith('-udp')) paired = `${s.name.slice(0, -4)}-tcp`;
  if (!paired) return null;
  return all.find((o) => o.protocol === 'openvpn' && o.name === paired) ?? null;
};

interface Props {
  creds: VPNCredentials | null;
  servers: VPNServer[];
  peerCounts?: Record<string, number>;
  onChanged: () => void;
}

export function ServersSection({ creds, servers, peerCounts, onChanged }: Props) {
  const paged = usePagedFilter(servers, matches);
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const [selected, setSelected] = useState<VPNServer | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingWg, setEditingWg] = useState<VPNServer | null>(null);
  const [downloading, setDownloading] = useState<VPNServer | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VPNServer | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteCertFiles, setDeleteCertFiles] = useState(false);
  const [pendingDisable, setPendingDisable] = useState<VPNServer | null>(null);
  const [disableSubmitting, setDisableSubmitting] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<VPNServer | null>(null);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);
  const toggleEnable = pendingToggle ? !pendingToggle.running : false;

  const deletePaired = pendingDelete ? ovpnPairedServer(pendingDelete, servers) : null;

  const sstpEnabled = servers.some((s) => s.protocol === 'sstp' && s.running);
  const l2tpEnabled = servers.some((s) => s.protocol === 'l2tp' && s.running);
  const disableLabel = pendingDisable?.protocol === 'l2tp' ? 'L2TP' : 'SSTP';

  const onCreated = () => {
    toast.notify({ title: t('servers.toast.created'), tone: 'success' });
    setAdding(false);
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    const paired = deletePaired;
    setDeleteSubmitting(true);
    try {
      if (target.protocol === 'openvpn') {
        await deleteOvpnServer(creds, target.name, deleteCertFiles);
      } else if (target.protocol === 'wireguard') {
        await deleteWireguardInterface(creds, target.name);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('servers.toast.deleteFailedDescription');
      toast.notify({
        title: t('servers.toast.deleteFailed'),
        description: message,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    setDeleteCertFiles(false);
    toast.notify({
      title: paired
        ? t('servers.toast.pairDeleted', { name: target.name, paired: paired.name })
        : t('servers.toast.deleted', { name: target.name }),
      tone: 'info',
    });
    onChanged();
  };

  const onConfirmDisable = async () => {
    if (!creds || !pendingDisable) return;
    const target = pendingDisable;
    setDisableSubmitting(true);
    try {
      if (target.protocol === 'l2tp') {
        await deleteL2tpServer(creds);
      } else {
        await deleteSstpServer(creds, deleteCertFiles);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('servers.toast.disableFailedDescription', {
                protocol: target.protocol === 'l2tp' ? 'L2TP' : 'SSTP',
              });
      toast.notify({
        title: t('servers.toast.disableFailed'),
        description: message,
        tone: 'danger',
      });
      setDisableSubmitting(false);
      return;
    }
    setDisableSubmitting(false);
    setPendingDisable(null);
    setDeleteCertFiles(false);
    toast.notify({ title: t('servers.toast.disabled', { name: target.name }), tone: 'info' });
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
            : enable
              ? t('servers.toast.ovpnEnableFailedDescription')
              : t('servers.toast.ovpnDisableFailedDescription');
      toast.notify({
        title: enable ? t('servers.toast.enableFailed') : t('servers.toast.disableFailed'),
        description: message,
        tone: 'danger',
      });
      setToggleSubmitting(false);
      return;
    }
    setToggleSubmitting(false);
    setPendingToggle(null);
    toast.notify({
      title: enable
        ? t('servers.toast.enabled', { name: target.name })
        : t('servers.toast.disabled', { name: target.name }),
      tone: 'info',
    });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t('servers.title')}
          count={servers.length}
          description={t('servers.description')}
          search={{
            value: paged.search,
            placeholder: t('servers.searchPlaceholder'),
            ariaLabel: t('servers.searchLabel'),
            onChange: paged.setSearch,
          }}
          action={{
            label: t('servers.add'),
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
            onDownloadConfig={(s) => setDownloading(s)}
            canMutate={!!creds}
            peerCounts={peerCounts}
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
          l2tpEnabled={l2tpEnabled}
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
            toast.notify({ title: t('servers.toast.wgUpdated'), tone: 'success' });
            onChanged();
          }}
        />
      ) : null}
      {downloading && downloading.protocol === 'openvpn' ? (
        <ExportOvpnDialog
          creds={creds}
          serverName={downloading.id.replace(/^ovpn:/, '')}
          defaultPublicAddress={creds?.host}
          onClose={() => setDownloading(null)}
        />
      ) : null}
      <ServerDetailsDialog server={selected} creds={creds} onClose={() => setSelected(null)} />
      <ConfirmDialog
        open={!!pendingDelete}
        title={deletePaired ? t('servers.delete.pairTitle') : t('servers.delete.title')}
        description={
          pendingDelete
            ? pendingDelete.protocol !== 'openvpn'
              ? t('servers.delete.description', { name: pendingDelete.name })
              : deletePaired
                ? t('servers.delete.ovpnPairDescription', {
                    name: pendingDelete.name,
                    paired: deletePaired.name,
                  })
                : t('servers.delete.ovpnDescription', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={deleteSubmitting ? t('shared.deleting') : t('shared.delete')}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => {
          if (deleteSubmitting) return;
          setPendingDelete(null);
          setDeleteCertFiles(false);
        }}
      >
        {pendingDelete?.protocol === 'openvpn' ? (
          <Checkbox
            label={t('servers.delete.alsoDeleteCertFiles')}
            checked={deleteCertFiles}
            disabled={deleteSubmitting}
            onChange={(e) => setDeleteCertFiles(e.target.checked)}
          />
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        open={!!pendingToggle}
        title={toggleEnable ? t('servers.toggle.enableTitle') : t('servers.toggle.disableTitle')}
        description={
          pendingToggle
            ? toggleEnable
              ? t('servers.toggle.enableDescription', { name: pendingToggle.name })
              : t('servers.toggle.disableDescription', { name: pendingToggle.name })
            : undefined
        }
        confirmLabel={
          toggleEnable
            ? toggleSubmitting
              ? t('shared.enabling')
              : t('shared.enable')
            : toggleSubmitting
              ? t('shared.disabling')
              : t('shared.disable')
        }
        destructive={!toggleEnable}
        onConfirm={onConfirmToggle}
        onCancel={() => (toggleSubmitting ? undefined : setPendingToggle(null))}
      />
      <ConfirmDialog
        open={!!pendingDisable}
        title={t('servers.disable.title', { protocol: disableLabel })}
        description={t('servers.disable.description', { protocol: disableLabel })}
        confirmLabel={disableSubmitting ? t('shared.disabling') : t('shared.disable')}
        destructive
        onConfirm={onConfirmDisable}
        onCancel={() => {
          if (disableSubmitting) return;
          setPendingDisable(null);
          setDeleteCertFiles(false);
        }}
      >
        {pendingDisable?.protocol === 'sstp' ? (
          <Checkbox
            label={t('servers.disable.alsoDeleteCerts')}
            checked={deleteCertFiles}
            disabled={disableSubmitting}
            onChange={(e) => setDeleteCertFiles(e.target.checked)}
          />
        ) : null}
      </ConfirmDialog>
    </Stack>
  );
}
