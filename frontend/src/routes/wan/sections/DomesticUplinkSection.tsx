import { useState } from 'react';
import { Cable } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { api, type DomesticUplink, type InterfaceResponse } from '../../../api';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { EmptyHint } from '../EmptyHint';
import { WanCard } from '../WanCard';
import { DomesticUplinkDialog } from '../dialogs/DomesticUplinkDialog';
import styles from '../WanPage.module.scss';

interface Props {
  routerId: string;
  items: DomesticUplink[];
  interfaces: InterfaceResponse[];
  onChanged: () => void;
}

export function DomesticUplinkSection({ routerId, items, interfaces, onChanged }: Props) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DomesticUplink | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DomesticUplink | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (u: DomesticUplink) => {
    setEditing(u);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = async (payload: Omit<DomesticUplink, 'id'>) => {
    if (editing) await api.wan.updateDomestic(editing.id, payload);
    else await api.wan.createDomestic(payload);
    closeDialog();
    toast.notify({
      title: editing ? 'Domestic uplink updated' : 'Domestic uplink added',
      tone: 'success',
    });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await api.wan.deleteDomestic(target.id);
    } catch (err) {
      toast.notify({
        title: 'Failed to delete uplink',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      setDeleteSubmitting(false);
      return;
    }
    setDeleteSubmitting(false);
    setPendingDelete(null);
    toast.notify({ title: `Uplink "${target.name}" deleted`, tone: 'info' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Domestic"
          count={items.length}
          description="Domestic uplink interfaces and connection type."
          action={{ label: 'New', onClick: openAdd }}
        />
        {items.length === 0 ? (
          <EmptyHint icon={<Cable size={20} aria-hidden />} text="No domestic uplinks yet" />
        ) : (
          <div className={styles.grid}>
            {items.map((u) => (
              <WanCard
                key={u.id}
                title={u.name}
                meta={`${u.mode} · ${u.interfaceName || 'no interface'}`}
                enabled={u.enabled}
                onEdit={() => openEdit(u)}
                onDelete={() => setPendingDelete(u)}
              />
            ))}
          </div>
        )}
      </Card>
      {dialogOpen ? (
        <DomesticUplinkDialog
          entity={editing ?? undefined}
          interfaces={interfaces}
          routerId={routerId}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete domestic uplink"
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
