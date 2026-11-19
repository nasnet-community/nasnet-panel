import { useState } from 'react';
import { Cable, Pencil, SatelliteDish } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  fetchWan,
  removeWanInterface,
  updateWanInterface,
  type InterfaceResponse,
  type SystemCredentials,
  type WanInterfaceType,
  type WanResponse,
} from '../../../api';
import { useSession } from '../../../state/SessionContext';
import { useRouter } from '../../../state/RouterStoreContext';
import { SectionHeader } from '../../vpn/sections/SectionHeader';
import { classifyInterface } from '../../easy-config/steps/wan/WanInterfaceSelect';
import { WanTable } from '../WanTable';
import { WanUplinkDialog, type WanUplinkValues } from '../dialogs/WanUplinkDialog';

interface Props {
  variant: WanInterfaceType;
  routerId: string;
  items: WanResponse[];
  itemsLoading?: boolean;
  itemsError?: string | null;
  interfaces: InterfaceResponse[];
  /** Interfaces assigned to the other WAN section; a move replaces them. */
  otherNames?: string[];
  interfacesLoading?: boolean;
  onChanged: () => Promise<void>;
}

const OTHER: Record<WanInterfaceType, WanInterfaceType> = {
  foreign: 'domestic',
  domestic: 'foreign',
};

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;

export function WanSection({
  variant,
  routerId,
  items,
  itemsLoading,
  itemsError,
  interfaces,
  otherNames = [],
  interfacesLoading,
  onChanged,
}: Props) {
  const toast = useToast();
  const { t } = useTranslation('internet');
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const other = OTHER[variant];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ iface: InterfaceResponse; wan: WanResponse } | null>(
    null,
  );
  const [pendingMove, setPendingMove] = useState<InterfaceResponse | null>(null);
  // Wireless moves need an SSID, asked for only after the move itself is confirmed.
  const [moveConfirmed, setMoveConfirmed] = useState(false);
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [pendingFree, setPendingFree] = useState<WanResponse | null>(null);

  const resolveCreds = (): SystemCredentials | null => {
    const creds = getCredentials(routerId);
    const host = router?.host;
    if (!creds || !host) return null;
    return { host, ...creds };
  };

  const notifyMissingCreds = () =>
    toast.notify({
      title: t('wan.section.missingCredsTitle'),
      description: t('wan.section.missingCredsDescription'),
      tone: 'danger',
    });

  // The WAN list carries only the interface name and type; the dialogs work on interfaces.
  const interfaceFor = (wan: WanResponse): InterfaceResponse =>
    interfaces.find((i) => i.name === wan.interface) ?? {
      id: wan.interface,
      name: wan.interface,
      type: wan.interfaceType,
      running: false,
      disabled: !wan.enabled,
      comment: wan.comment,
    };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const openEdit = async (row: WanResponse) => {
    const creds = resolveCreds();
    let wan = row;
    if (creds) {
      try {
        wan = await fetchWan(creds, row.interface);
      } catch {
        // The list row is a fine fallback when the single read fails.
      }
    }
    setEditing({ iface: interfaceFor(row), wan });
  };

  const onSubmit = async ({ interfaceName, ...rest }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      notifyMissingCreds();
      return;
    }
    try {
      await updateWanInterface(creds, { interface: interfaceName, type: variant, ...rest });
    } catch (err) {
      toast.notify({
        title: t(`wan.${variant}.changeFailedTitle`),
        description: errorText(err, t('wan.section.assignFailedFallback')),
        tone: 'danger',
      });
      return;
    }
    await onChanged();
    closeDialog();
    toast.notify({ title: t(`wan.${variant}.changed`), tone: 'success' });
  };

  const startMove = (row: WanResponse) => {
    setMoveConfirmed(false);
    setPendingMove(interfaceFor(row));
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
      notifyMissingCreds();
      return;
    }
    setMoveSubmitting(true);
    try {
      await updateWanInterface(creds, { interface: target.name, type: other });
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
    toast.notify({ title: t(`wan.${variant}.moved`, { name: target.name }), tone: 'info' });
  };

  const onMoveSubmit = async ({ interfaceName, ...rest }: WanUplinkValues) => {
    const creds = resolveCreds();
    if (!creds) {
      notifyMissingCreds();
      return;
    }
    await updateWanInterface(creds, { interface: interfaceName, type: other, ...rest });
    await onChanged();
    cancelMove();
    toast.notify({ title: t(`wan.${variant}.moved`, { name: interfaceName }), tone: 'info' });
  };

  const onConfirmFree = async () => {
    if (!pendingFree) return;
    const target = pendingFree;
    const creds = resolveCreds();
    if (!creds) {
      notifyMissingCreds();
      return;
    }
    try {
      await removeWanInterface(creds, target.interface);
    } catch (err) {
      toast.notify({
        title: t('wan.section.freeFailedTitle'),
        description: errorText(err, t('wan.section.freeFailedFallback')),
        tone: 'danger',
      });
      return;
    }
    await onChanged();
    setPendingFree(null);
    toast.notify({ title: t('wan.section.freed', { name: target.interface }), tone: 'success' });
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t(`wan.${variant}.title`)}
          description={t(`wan.${variant}.description`)}
          action={{
            label: t('wan.section.change'),
            onClick: () => setDialogOpen(true),
            icon: <Pencil size={14} aria-hidden />,
          }}
        />
        <WanTable
          rows={items}
          loading={itemsLoading}
          error={itemsError}
          emptyIcon={
            variant === 'foreign' ? (
              <SatelliteDish size={20} aria-hidden />
            ) : (
              <Cable size={20} aria-hidden />
            )
          }
          emptyMessage={t(`wan.${variant}.empty`)}
          onEdit={(row) => {
            void openEdit(row);
          }}
          moveLabel={(row) => t(`wan.${variant}.moveLabel`, { name: row.interface })}
          onMove={startMove}
          onFree={setPendingFree}
        />
      </Card>
      {dialogOpen ? (
        <WanUplinkDialog
          variant={variant}
          title={t(`wan.${variant}.dialogTitle`)}
          interfaces={interfaces}
          excludeNames={otherNames}
          interfacesLoading={interfacesLoading}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      {editing ? (
        <WanUplinkDialog
          variant={variant}
          title={t('wan.section.editTitle', { name: editing.iface.name })}
          interfaces={interfaces}
          excludeNames={otherNames}
          interfacesLoading={interfacesLoading}
          initialInterface={editing.iface}
          initialWan={editing.wan}
          onCancel={closeDialog}
          onSubmit={onSubmit}
        />
      ) : null}
      {pendingMove && moveWireless && moveConfirmed ? (
        <WanUplinkDialog
          variant={other}
          title={t(`wan.${variant}.moveLabel`, { name: pendingMove.name })}
          description={t(`wan.${variant}.moveWirelessDescription`, { name: pendingMove.name })}
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
        title={t(`wan.${variant}.confirmTitle`)}
        description={
          !pendingMove
            ? undefined
            : otherNames.length > 0
              ? t(`wan.${variant}.confirmDescriptionReplace`, {
                  name: pendingMove.name,
                  current: otherNames.join(', '),
                })
              : t(`wan.${variant}.confirmDescription`, { name: pendingMove.name })
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
      <ConfirmDialog
        open={!!pendingFree}
        title={t('wan.section.freeConfirmTitle')}
        description={
          pendingFree
            ? t('wan.section.freeConfirmDescription', { name: pendingFree.interface })
            : undefined
        }
        destructive
        confirmLabel={t('wan.section.free')}
        onConfirm={onConfirmFree}
        onCancel={() => setPendingFree(null)}
      />
    </Stack>
  );
}
