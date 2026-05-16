import { useState } from 'react';
import { SatelliteDish } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { api, type InterfaceResponse, type StarlinkUplink } from '../../../api';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { WanTable } from '../WanTable';
import { StarlinkUplinkDialog } from '../dialogs/StarlinkUplinkDialog';

interface Props {
  routerId: string;
  items: StarlinkUplink[];
  interfaces: InterfaceResponse[];
  onChanged: () => void;
}

export function StarlinkSection({ routerId, items, interfaces, onChanged }: Props) {
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StarlinkUplink | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StarlinkUplink | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (u: StarlinkUplink) => {
    setEditing(u);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const onSubmit = async (payload: Omit<StarlinkUplink, 'id'>) => {
    if (editing) await api.wan.updateStarlink(editing.id, payload);
    else await api.wan.createStarlink(payload);
    closeDialog();
    toast.notify({
      title: editing ? 'Starlink uplink updated' : 'Starlink uplink added',
      tone: 'success',
    });
    onChanged();
  };

  const onConfirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleteSubmitting(true);
    try {
      await api.wan.deleteStarlink(target.id);
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

  const onToggle = async (u: StarlinkUplink, enabled: boolean) => {
    try {
      await api.wan.updateStarlink(u.id, { enabled });
    } catch (err) {
      toast.notify({
        title: 'Failed to update uplink',
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
          title="Foreign / Starlink"
          description="Starlink uplink interfaces."
          action={{ label: 'New', onClick: openAdd }}
        />
        <WanTable
          rows={items}
          rowKey={(u) => u.id}
          name={(u) => u.name}
          tag={(u) => u.interfaceType}
          detail={(u) => u.interfaceName || 'no interface'}
          enabled={(u) => u.enabled}
          emptyIcon={<SatelliteDish size={20} aria-hidden />}
          emptyMessage="No Starlink uplinks yet"
          onToggle={onToggle}
          onEdit={(u) => openEdit(u)}
          onDelete={(u) => setPendingDelete(u)}
        />
      </Card>
      {dialogOpen ? (
        <StarlinkUplinkDialog
          entity={editing ?? undefined}
          interfaces={interfaces}
          routerId={routerId}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Starlink uplink"
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
