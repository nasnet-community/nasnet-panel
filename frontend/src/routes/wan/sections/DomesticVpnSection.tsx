import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { api, type WanVpnClient } from '../../../api';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { WanTable } from '../WanTable';
import { WanVpnDialog } from '../dialogs/WanVpnDialog';
import { vpnMeta } from '../vpnMeta';

interface Props {
  routerId: string;
  items: WanVpnClient[];
  onChanged: () => void;
}

export function DomesticVpnSection({ routerId, items, onChanged }: Props) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WanVpnClient | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WanVpnClient | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: WanVpnClient) => {
    setEditing(c);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = async (payload: Omit<WanVpnClient, 'id'>) => {
    if (editing) await api.wan.updateDomesticVpn(editing.id, payload);
    else await api.wan.createDomesticVpn(payload);
    closeDialog();
    toast.notify({
      title: editing ? 'Domestic VPN interface updated' : 'Domestic VPN interface added',
      tone: 'success',
    });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await api.wan.deleteDomesticVpn(target.id);
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

  const onToggle = async (c: WanVpnClient, enabled: boolean) => {
    try {
      await api.wan.updateDomesticVpn(c.id, { enabled });
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
          enabled={(c) => c.enabled}
          emptyIcon={<Shield size={20} aria-hidden />}
          emptyMessage="No domestic VPN interfaces yet"
          onToggle={onToggle}
          onEdit={(c) => openEdit(c)}
          onDelete={(c) => setPendingDelete(c)}
        />
      </Card>
      {dialogOpen ? (
        <WanVpnDialog
          entity={editing ?? undefined}
          routerId={routerId}
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
