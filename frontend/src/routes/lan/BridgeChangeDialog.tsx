import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldStack, Label, Select, Stack, useToast } from '@nasnet/ui';
import styles from './BridgeChangeDialog.module.scss';
import {
  updateInterfaceBridge,
  type BridgePortResponse,
  type BridgeResponse,
  type SystemCredentials,
} from '../../api';
import { bridgeDescription, bridgeLabel, isForeignBridge } from './bridgeTypes';

interface BridgeChangeDialogProps {
  open: boolean;
  port: BridgePortResponse;
  bridges: BridgeResponse[];
  creds: SystemCredentials;
  onClose: () => void;
  onChanged: () => void;
}

export function BridgeChangeDialog({
  open,
  port,
  bridges,
  creds,
  onClose,
  onChanged,
}: BridgeChangeDialogProps) {
  const toast = useToast();
  const { t } = useTranslation('network');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTarget('');
  }, [open, port.interface]);

  // Built on every render so the translated labels follow a language change.
  const options = bridges
    .filter((b) => !b.disabled && b.name !== port.bridge)
    .map((b) => ({
      value: b.name,
      label: bridgeLabel(b.name),
      description: bridgeDescription(b.name, b.comment),
    }));

  const submit = async () => {
    if (!target) {
      toast.notify({ title: t('bridge.dialog.selectBridge'), tone: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await updateInterfaceBridge(creds, { interface: port.interface, bridge: target });
      toast.notify({
        title: t('bridge.dialog.changed'),
        description: t('bridge.dialog.changedDetail', {
          interface: port.interface,
          bridge: bridgeLabel(target),
        }),
        tone: 'success',
      });
      onChanged();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('bridge.dialog.changeFailedDetail');
      toast.notify({
        title: t('bridge.dialog.changeFailed'),
        description: message,
        tone: 'danger',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('bridge.dialog.title', { interface: port.interface })}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !target}>
            {busy ? t('common.changing') : t('common.change')}
          </Button>
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.readonlyGrid}>
          <span className={styles.readonlyLabel}>{t('bridge.dialog.currentBridge')}</span>
          <span className={styles.readonlyValue}>{bridgeLabel(port.bridge)}</span>
        </div>

        <FieldStack>
          <Label as="span" id="bridge-target-label">
            {t('bridge.dialog.newBridge')}
          </Label>
          <Select
            options={options}
            value={target}
            onChange={setTarget}
            placeholder={
              options.length > 0
                ? t('bridge.dialog.selectPlaceholder')
                : t('bridge.dialog.noOtherBridge')
            }
            disabled={busy || options.length === 0}
            aria-labelledby="bridge-target-label"
          />
        </FieldStack>

        <div className={styles.warning} role="alert">
          <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
          <p>{t('bridge.dialog.restartWarning', { interface: port.interface })}</p>
        </div>

        {isForeignBridge(target) ? (
          <div className={styles.warning} role="alert">
            <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
            <p>{t('bridge.dialog.foreignWarning', { interface: port.interface })}</p>
          </div>
        ) : null}
      </Stack>
    </Dialog>
  );
}
