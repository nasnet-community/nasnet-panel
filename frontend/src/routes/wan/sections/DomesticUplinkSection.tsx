import { useState } from 'react';
import { Cable } from 'lucide-react';
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

export function DomesticUplinkSection({
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
        type: 'domestic',
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
        title: 'Failed to add domestic uplink',
        description: message,
        tone: 'danger',
      });
      return;
    }
    closeDialog();
    toast.notify({ title: 'Domestic uplink added', tone: 'success' });
    void onChanged();
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
      await updateWanInterface(creds, { interface: target.name, type: 'foreign' });
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
    toast.notify({ title: `Moved "${target.name}" to Foreign`, tone: 'info' });
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
    await updateWanInterface(creds, { interface: interfaceName, type: 'foreign', ssid, password });
    await onChanged();
    setPendingMove(null);
    toast.notify({ title: `Moved "${interfaceName}" to Foreign`, tone: 'info' });
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="Domestic"
          description="Interfaces tagged as the domestic uplink."
          action={{ label: 'New', onClick: openAdd }}
        />
        <WanTable
          rows={items}
          rowKey={(i) => i.id}
          name={(i) => i.name}
          tag={(i) => i.type}
          detail={(i) => i.comment || '—'}
          enabled={(i) => !i.disabled}
          emptyIcon={<Cable size={20} aria-hidden />}
          emptyMessage="No domestic uplinks yet"
          editLabel={(i) => `Move ${i.name} to Foreign`}
          onEdit={(i) => setPendingMove(i)}
        />
      </Card>
      {dialogOpen ? (
        <WanUplinkDialog
          variant="domestic"
          title="Add domestic uplink"
          interfaces={interfaces}
          excludeNames={excludeNames}
          interfacesLoading={interfacesLoading}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      {pendingMove && moveWireless ? (
        <WanUplinkDialog
          variant="foreign"
          title={`Move ${pendingMove.name} to Foreign`}
          interfaces={[pendingMove]}
          initialInterface={pendingMove}
          onCancel={() => setPendingMove(null)}
          onSubmit={onMoveSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingMove && !moveWireless}
        title="Move to Foreign"
        description={
          pendingMove
            ? `Re-tag "${pendingMove.name}" as the Foreign uplink? It will move to that section.`
            : undefined
        }
        confirmLabel={moveSubmitting ? 'Moving…' : 'Move'}
        onConfirm={onConfirmMove}
        onCancel={() => (moveSubmitting ? undefined : setPendingMove(null))}
      />
    </Stack>
  );
}
