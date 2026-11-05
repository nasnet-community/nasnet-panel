import { useState } from 'react';
import { Pencil, SatelliteDish } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  /** Interfaces assigned to the other WAN section; a move replaces them. */
  otherNames?: string[];
  interfacesLoading?: boolean;
  onChanged: () => Promise<void>;
}

export function StarlinkSection({
  routerId,
  items,
  interfaces,
  otherNames = [],
  interfacesLoading,
  onChanged,
}: Props) {
  const toast = useToast();
  const { t } = useTranslation('internet');
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<InterfaceResponse | null>(null);
  // Wireless moves need an SSID, asked for only after the move itself is confirmed.
  const [moveConfirmed, setMoveConfirmed] = useState(false);
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
        title: t('wan.section.missingCredsTitle'),
        description: t('wan.section.missingCredsDescription'),
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
            : t('wan.section.assignFailedFallback');
      toast.notify({
        title: t('wan.foreign.changeFailedTitle'),
        description: message,
        tone: 'danger',
      });
      return;
    }
    await onChanged();
    closeDialog();
    toast.notify({ title: t('wan.foreign.changed'), tone: 'success' });
  };

  const startMove = (target: InterfaceResponse) => {
    setMoveConfirmed(false);
    setPendingMove(target);
  };

  const cancelMove = () => {
    setPendingMove(null);
    setMoveConfirmed(false);
  };

  const moveWireless = pendingMove ? classifyInterface(pendingMove) === 'wireless' : false;

  const onConfirmMove = async () => {
    if (!pendingMove) return;
    if (moveWireless) {
      setMoveConfirmed(true);
      return;
    }
    const target = pendingMove;
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: t('wan.section.missingCredsTitle'),
        description: t('wan.section.missingCredsDescription'),
        tone: 'danger',
      });
      return;
    }
    setMoveSubmitting(true);
    try {
      await updateWanInterface(creds, { interface: target.name, type: 'domestic' });
    } catch (err) {
      toast.notify({
        title: t('wan.section.moveFailedTitle'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      setMoveSubmitting(false);
      return;
    }
    await onChanged();
    setMoveSubmitting(false);
    cancelMove();
    toast.notify({ title: t('wan.foreign.moved', { name: target.name }), tone: 'info' });
  };

  const onMoveSubmit = async ({ interfaceName, ssid, password }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      toast.notify({
        title: t('wan.section.missingCredsTitle'),
        description: t('wan.section.missingCredsDescription'),
        tone: 'danger',
      });
      return;
    }
    await updateWanInterface(creds, { interface: interfaceName, type: 'domestic', ssid, password });
    await onChanged();
    cancelMove();
    toast.notify({ title: t('wan.foreign.moved', { name: interfaceName }), tone: 'info' });
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t('wan.foreign.title')}
          description={t('wan.foreign.description')}
          action={{
            label: t('wan.section.change'),
            onClick: openAdd,
            icon: <Pencil size={14} aria-hidden />,
          }}
        />
        <WanTable
          rows={items}
          rowKey={(i) => i.id}
          name={(i) => i.name}
          tag={(i) => i.type}
          detail={(i) => i.comment || '—'}
          enabled={(i) => !i.disabled}
          emptyIcon={<SatelliteDish size={20} aria-hidden />}
          emptyMessage={t('wan.foreign.empty')}
          moveLabel={(i) => t('wan.foreign.moveLabel', { name: i.name })}
          onMove={startMove}
        />
      </Card>
      {dialogOpen ? (
        <WanUplinkDialog
          variant="foreign"
          title={t('wan.foreign.dialogTitle')}
          interfaces={interfaces}
          excludeNames={otherNames}
          interfacesLoading={interfacesLoading}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      {pendingMove && moveWireless && moveConfirmed ? (
        <WanUplinkDialog
          variant="domestic"
          title={t('wan.foreign.moveLabel', { name: pendingMove.name })}
          description={t('wan.foreign.moveWirelessDescription', { name: pendingMove.name })}
          submitLabel={t('wan.section.move')}
          submittingLabel={t('wan.section.moving')}
          interfaces={[pendingMove]}
          initialInterface={pendingMove}
          onCancel={cancelMove}
          onSubmit={onMoveSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={!!pendingMove && !moveConfirmed}
        title={t('wan.foreign.confirmTitle')}
        description={
          !pendingMove
            ? undefined
            : otherNames.length > 0
              ? t('wan.foreign.confirmDescriptionReplace', {
                  name: pendingMove.name,
                  current: otherNames.join(', '),
                })
              : t('wan.foreign.confirmDescription', { name: pendingMove.name })
        }
        destructive={otherNames.length > 0}
        confirmLabel={
          moveWireless
            ? t('wan.section.continue')
            : moveSubmitting
              ? t('wan.section.moving')
              : t('wan.section.move')
        }
        onConfirm={onConfirmMove}
        onCancel={() => (moveSubmitting ? undefined : cancelMove())}
      />
    </Stack>
  );
}
