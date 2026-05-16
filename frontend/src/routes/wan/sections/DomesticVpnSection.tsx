import { useState } from 'react';
import { Shield } from 'lucide-react';
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

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Domestic VPN Interfaces"
          count={items.length}
          description="VPN interfaces bound to the domestic uplink."
          action={{ label: 'New', onClick: openAdd }}
        />
        {items.length === 0 ? (
          <EmptyHint
            icon={<Shield size={20} aria-hidden />}
            text="No domestic VPN interfaces yet"
          />
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
