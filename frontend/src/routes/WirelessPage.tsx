import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('wireless');
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
    bridgesError,
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
          bridgesError={bridgesError}
          onRetryBridges={openAddVirtual}
          onCreate={createVirtual}
          onClose={closeAddVirtual}
        />
      ) : null}
      <ConfirmDialog
        open={!!deletingIface}
        title={t('page.deleteTitle')}
        description={
          deletingIface
            ? t('page.deleteDescription', {
                name: deletingIface.ssid ?? deletingIface.name,
                iface: deletingIface.name,
              })
            : undefined
        }
        confirmLabel={t('page.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmDeleteVirtual}
        onCancel={() => requestDeleteVirtual(null)}
      />
    </Stack>
  );
}
