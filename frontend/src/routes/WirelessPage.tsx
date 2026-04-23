import { useParams } from 'react-router-dom';
import { Stack } from '@nasnet/ui';
import { StatsStrip } from './wireless/StatsStrip';
import { ClientsCard } from './wireless/ClientsCard';
import { InterfacesCard } from './wireless/InterfacesCard';
import { EditDialog } from './wireless/EditDialog';
import { WirelessSkeleton } from './wireless/WirelessSkeleton';
import { useWireless } from './wireless/useWireless';

export function WirelessPage() {
  const { id } = useParams<{ id: string }>();
  const {
    settings,
    interfaces,
    clients,
    loading,
    editingSettings,
    openEdit,
    closeEdit,
    save,
    toggleInterface,
  } = useWireless(id);

  if (loading && !settings) {
    return <WirelessSkeleton />;
  }

  return (
    <Stack>
      <StatsStrip clients={clients} interfaces={interfaces} settings={settings} />
      <ClientsCard clients={clients} />
      <InterfacesCard
        interfaces={interfaces}
        settings={settings}
        onToggle={toggleInterface}
        onEdit={openEdit}
      />
      {editingSettings ? (
        <EditDialog settings={editingSettings} onSave={save} onClose={closeEdit} />
      ) : null}
    </Stack>
  );
}
