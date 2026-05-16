import { useState } from 'react';
import { Cable } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import { api, type DomesticUplink, type InterfaceResponse } from '../../../api';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { WanTable } from '../WanTable';
import { DomesticUplinkDialog } from '../dialogs/DomesticUplinkDialog';

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

  const onToggle = async (u: DomesticUplink, enabled: boolean) => {
    try {
      await api.wan.updateDomestic(u.id, { enabled });
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
          title="Domestic"
          description="Domestic uplink interfaces and connection type."
          action={{ label: 'New', onClick: openAdd }}
        />
        <WanTable
          rows={items}
          rowKey={(u) => u.id}
          name={(u) => u.name}
          tag={(u) => u.mode}
          detail={(u) => u.interfaceName || 'no interface'}
          enabled={(u) => u.enabled}
          emptyIcon={<Cable size={20} aria-hidden />}
          emptyMessage="No domestic uplinks yet"
          onToggle={onToggle}
          onEdit={(u) => openEdit(u)}
          onDelete={(u) => setPendingDelete(u)}
        />
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
