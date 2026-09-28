import { useParams } from 'react-router-dom';
import { ConfirmDialog, Stack } from '@nasnet/ui';
import { StatsStrip } from './wireless/StatsStrip';
import { ClientsCard } from './wireless/ClientsCard';
import { InterfacesCard } from './wireless/InterfacesCard';
import { EditDialog } from './wireless/EditDialog';
import { AddVirtualDialog } from './wireless/AddVirtualDialog';
import { WirelessSkeleton } from './wireless/WirelessSkeleton';
import { useWireless } from './wireless/useWireless';

export function WirelessPage() {
  const { id } = useParams<{ id: string }>();
  const {
    settings,
    interfaces,
    clients,
    loading,
    editingIface,
    editingSettings,
    openEdit,
    closeEdit,
    save,
    toggleInterface,
    addingVirtual,
    bridges,
    openAddVirtual,
    closeAddVirtual,
    createVirtual,
    deletingIface,
    requestDeleteVirtual,
    confirmDeleteVirtual,
  } = useWireless(id);

  if (loading && !settings) {
    return <WirelessSkeleton />;
  }

  return (
    <Stack>
      <StatsStrip clients={clients} interfaces={interfaces} />
      <ClientsCard clients={clients} />
      <InterfacesCard
        interfaces={interfaces}
        settings={settings}
        onToggle={toggleInterface}
        onEdit={openEdit}
        onAddVirtual={openAddVirtual}
        onDelete={requestDeleteVirtual}
      />
      {editingSettings ? (
        <EditDialog
          settings={editingSettings}
          isVirtual={editingIface?.isVirtual}
          onSave={save}
          onClose={closeEdit}
        />
      ) : null}
      {addingVirtual ? (
        <AddVirtualDialog
          interfaces={interfaces}
          bridges={bridges}
          onCreate={createVirtual}
          onClose={closeAddVirtual}
        />
      ) : null}
      <ConfirmDialog
        open={!!deletingIface}
        title="Delete virtual interface"
        description={
          deletingIface
            ? `Delete ${deletingIface.ssid ?? deletingIface.name} (${deletingIface.name})? Connected clients will be disconnected. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDeleteVirtual}
        onCancel={() => requestDeleteVirtual(null)}
      />
    </Stack>
  );
}
