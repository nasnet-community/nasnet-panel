import { useState } from 'react';
import { SatelliteDish } from 'lucide-react';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  updateWanInterface,
  type InterfaceResponse,
  type SystemCredentials,
} from '../../../api';
import { useSession } from '../../../state/SessionContext';
import { useRouter } from '../../../state/RouterStoreContext';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { classifyInterface } from '../../easy-config/steps/wan/WanInterfaceSelect';
import { WanTable } from '../WanTable';
import { WanUplinkDialog, type WanUplinkValues } from '../dialogs/WanUplinkDialog';

interface Props {
  routerId: string;
  items: InterfaceResponse[];
  interfaces: InterfaceResponse[];
  excludeNames?: string[];
  interfacesLoading?: boolean;
  onChanged: () => Promise<void>;
}

export function StarlinkSection({
  routerId,
  items,
  interfaces,
  excludeNames,
  interfacesLoading,
  onChanged,
}: Props) {
  const toast = useToast();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InterfaceResponse | null>(null);
  const [pendingMove, setPendingMove] = useState<InterfaceResponse | null>(null);
  const [moveSubmitting, setMoveSubmitting] = useState(false);

  const resolveCreds = (): SystemCredentials | null => {
    const creds = getCredentials(routerId);
    const host = router?.host;
    if (!creds || !host) return null;
    return { host, ...creds };
  };

  const openAdd = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  const onSubmit = async ({ interfaceName, ssid, password }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Reconnect to the router and try again.',
        tone: 'danger',
      });
      return;
    }
    try {
      await updateWanInterface(creds, {
        interface: interfaceName,
        type: 'foreign',
        ssid,
        password,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to assign interface.';
      toast.notify({
        title: 'Failed to add Starlink uplink',
        description: message,
        tone: 'danger',
      });
      return;
    }
    await onChanged();
    closeDialog();
    toast.notify({ title: 'Starlink uplink added', tone: 'success' });
  };

  const onEditSubmit = async ({ interfaceName, ssid, password }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Reconnect to the router and try again.',
        tone: 'danger',
      });
      return;
    }
    await updateWanInterface(creds, { interface: interfaceName, type: 'foreign', ssid, password });
    await onChanged();
    setEditTarget(null);
    toast.notify({ title: `Updated "${interfaceName}"`, tone: 'success' });
  };

  const onConfirmMove = async () => {
    if (!pendingMove) return;
    const target = pendingMove;
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Reconnect to the router and try again.',
        tone: 'danger',
      });
      return;
    }
    setMoveSubmitting(true);
    try {
      await updateWanInterface(creds, { interface: target.name, type: 'domestic' });
    } catch (err) {
      toast.notify({
        title: 'Failed to move uplink',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      setMoveSubmitting(false);
      return;
    }
    await onChanged();
    setMoveSubmitting(false);
    setPendingMove(null);
    toast.notify({ title: `Moved "${target.name}" to Domestic`, tone: 'info' });
  };

  const moveWireless = pendingMove ? classifyInterface(pendingMove) === 'wireless' : false;

  const onMoveSubmit = async ({ interfaceName, ssid, password }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: 'Missing router credentials',
        description: 'Reconnect to the router and try again.',
        tone: 'danger',
      });
      return;
    }
    await updateWanInterface(creds, { interface: interfaceName, type: 'domestic', ssid, password });
    await onChanged();
    setPendingMove(null);
    toast.notify({ title: `Moved "${interfaceName}" to Domestic`, tone: 'info' });
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Foreign / Starlink"
          description="Interfaces tagged as the foreign (Starlink) uplink."
          action={{ label: 'Change', onClick: openAdd }}
        />
        <WanTable
          rows={items}
          rowKey={(i) => i.id}
          name={(i) => i.name}
          tag={(i) => i.type}
          detail={(i) => i.comment || '—'}
          enabled={(i) => !i.disabled}
          emptyIcon={<SatelliteDish size={20} aria-hidden />}
          emptyMessage="No Starlink uplinks yet"
          editLabel={(i) => `Edit ${i.name}`}
          onEdit={(i) => setEditTarget(i)}
          moveLabel={(i) => `Move ${i.name} to Domestic`}
          onMove={(i) => setPendingMove(i)}
        />
      </Card>
      {dialogOpen ? (
        <WanUplinkDialog
          variant="foreign"
          title="Add Starlink uplink"
          interfaces={interfaces}
          excludeNames={excludeNames}
          interfacesLoading={interfacesLoading}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      {editTarget ? (
        <WanUplinkDialog
          variant="foreign"
          title={`Edit ${editTarget.name}`}
          interfaces={[editTarget]}
          initialInterface={editTarget}
          onCancel={() => setEditTarget(null)}
          onSubmit={onEditSubmit}
        />
      ) : null}
      {pendingMove && moveWireless ? (
        <WanUplinkDialog
          variant="domestic"
          title={`Move ${pendingMove.name} to Domestic`}
          interfaces={[pendingMove]}
          initialInterface={pendingMove}
          onCancel={() => setPendingMove(null)}
          onSubmit={onMoveSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingMove && !moveWireless}
        title="Move to Domestic"
        description={
          pendingMove
            ? `Re-tag "${pendingMove.name}" as the Domestic uplink? It will move to that section.`
            : undefined
        }
        confirmLabel={moveSubmitting ? 'Moving…' : 'Move'}
        onConfirm={onConfirmMove}
        onCancel={() => (moveSubmitting ? undefined : setPendingMove(null))}
      />
    </Stack>
  );
}
