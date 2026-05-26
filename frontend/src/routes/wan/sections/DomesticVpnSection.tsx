import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { ApiError, type SystemCredentials, type VPNClientResponse } from '../../../api';
import { useSession } from '../../../state/SessionContext';
import { useRouter } from '../../../state/RouterStoreContext';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { WanTable } from '../WanTable';
import { WanVpnDialog } from '../dialogs/WanVpnDialog';
import { vpnMeta } from '../vpnMeta';
import { createWanVpn, deleteWanVpn, toggleWanVpn } from '../wanVpn';
import type { WanVpnFormPayload } from '../types';

interface Props {
  routerId: string;
  items: VPNClientResponse[];
  onChanged: () => void;
}

export function DomesticVpnSection({ routerId, items, onChanged }: Props) {
  const toast = useToast();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VPNClientResponse | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const resolveCreds = (): SystemCredentials | null => {
    const creds = getCredentials(routerId);
    const host = router?.host;
    if (!creds || !host) return null;
    return { host, ...creds };
  };

  const requireCreds = (): SystemCredentials | null => {
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Reconnect to the router and try again.',
        tone: 'danger',
      });
    }
    return creds;
  };

  const openAdd = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  const onSubmit = async (payload: WanVpnFormPayload) => {
    const creds = requireCreds();
    if (!creds) return;
    try {
      await createWanVpn(creds, 'domestic', payload);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add VPN interface.';
      toast.notify({ title: 'Failed to add domestic VPN', description: message, tone: 'danger' });
      return;
    }
    closeDialog();
    toast.notify({ title: 'Domestic VPN interface added', tone: 'success' });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const creds = requireCreds();
    if (!creds) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await deleteWanVpn(creds, target);
    } catch (err) {
      toast.notify({
        title: 'Failed to delete VPN interface',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `VPN interface "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  const onToggle = async (c: VPNClientResponse, enabled: boolean) => {
    const creds = requireCreds();
    if (!creds) return;
    try {
      await toggleWanVpn(creds, c.name, enabled);
    } catch (err) {
      toast.notify({
        title: 'Failed to update VPN interface',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      return;
    }
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Domestic VPN Interfaces"
          description="VPN interfaces bound to the domestic uplink."
          action={{ label: 'New', onClick: openAdd }}
        />
        <WanTable
          rows={items}
          rowKey={(c) => c.id}
          name={(c) => c.name}
          tag={(c) => vpnMeta(c).tag}
          detail={(c) => vpnMeta(c).detail}
          enabled={(c) => !c.disabled}
          emptyIcon={<Shield size={20} aria-hidden />}
          emptyMessage="No domestic VPN interfaces yet"
          onToggle={onToggle}
          onDelete={(c) => setPendingDelete(c)}
        />
      </Card>
      {dialogOpen ? (
        <WanVpnDialog
          addTitle="Add domestic VPN interface"
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete domestic VPN interface"
        description={
          pendingDelete ? `Remove "${pendingDelete.name}"? This cannot be undone.` : undefined
        }
        confirmLabel={deleteSubmitting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => (deleteSubmitting ? undefined : setPendingDelete(null))}
      />
    </Stack>
  );
}
