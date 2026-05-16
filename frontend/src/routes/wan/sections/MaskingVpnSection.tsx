import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { api, type WanVpnClient } from '../../../api';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { EmptyHint } from '../EmptyHint';
import { WanCard } from '../WanCard';
import { WanVpnDialog } from '../dialogs/WanVpnDialog';
import { vpnMeta } from '../vpnMeta';
import styles from '../WanPage.module.scss';

interface Props {
  routerId: string;
  items: WanVpnClient[];
  onChanged: () => void;
}

export function MaskingVpnSection({ routerId, items, onChanged }: Props) {
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
    if (editing) await api.wan.updateMaskingVpn(editing.id, payload);
    else await api.wan.createMaskingVpn(payload);
    closeDialog();
    toast.notify({
      title: editing ? 'Masking VPN client updated' : 'Masking VPN client added',
      tone: 'success',
    });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await api.wan.deleteMaskingVpn(target.id);
    } catch (err) {
      toast.notify({
        title: 'Failed to delete VPN client',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `VPN client "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Starlink Masking VPN Client"
          count={items.length}
          description="VPN clients that conceal the Starlink IP."
          action={{ label: 'New', onClick: openAdd }}
        />
        {items.length === 0 ? (
          <EmptyHint icon={<Lock size={20} aria-hidden />} text="No masking VPN clients yet" />
        ) : (
          <div className={styles.grid}>
            {items.map((c) => (
              <WanCard
                key={c.id}
                title={c.name}
                meta={vpnMeta(c)}
                enabled={c.enabled}
                onEdit={() => openEdit(c)}
                onDelete={() => setPendingDelete(c)}
              />
            ))}
          </div>
        )}
      </Card>
      {dialogOpen ? (
        <WanVpnDialog
          entity={editing ?? undefined}
          routerId={routerId}
          addTitle="Add masking VPN client"
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete masking VPN client"
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
