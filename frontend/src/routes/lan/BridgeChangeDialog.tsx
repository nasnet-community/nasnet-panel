import { useEffect, useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
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
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTarget('');
  }, [open, port.interface]);

  const options = useMemo(
    () =>
      bridges
        .filter((b) => !b.disabled && b.name !== port.bridge)
        .map((b) => ({
          value: b.name,
          label: bridgeLabel(b.name),
          description: bridgeDescription(b.name, b.comment),
        })),
    [bridges, port.bridge],
  );

  const submit = async () => {
    if (!target) {
      toast.notify({ title: 'Select a bridge', tone: 'warning' });
      return;
    }
    setBusy(true);
    try {
      await updateInterfaceBridge(creds, { interface: port.interface, bridge: target });
      toast.notify({
        title: 'Bridge changed',
        description: `${port.interface} is now a port of ${bridgeLabel(target)}.`,
        tone: 'success',
      });
      onChanged();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change the bridge.';
      toast.notify({ title: 'Failed to change bridge', description: message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Change bridge for ${port.interface}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !target}>
            {busy ? 'Changing…' : 'Change'}
          </Button>
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.readonlyGrid}>
          <span className={styles.readonlyLabel}>Current bridge</span>
          <span className={styles.readonlyValue}>{bridgeLabel(port.bridge)}</span>
        </div>

        <FieldStack>
          <Label as="span" id="bridge-target-label">
            New bridge
          </Label>
          <Select
            options={options}
            value={target}
            onChange={setTarget}
            placeholder={options.length > 0 ? 'Select a bridge…' : 'No other bridge available'}
            disabled={busy || options.length === 0}
            aria-labelledby="bridge-target-label"
          />
        </FieldStack>

        <div className={styles.warning} role="alert">
          <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
          <p>
            {port.interface} restarts to apply this. You may lose the network or the internet for a
            few seconds.
          </p>
        </div>

        {isForeignBridge(target) ? (
          <div className={styles.warning} role="alert">
            <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
            <p>
              All traffic on {port.interface} will be routed to foreign. Domestic sites may become
              unreachable.
            </p>
          </div>
        ) : null}
      </Stack>
    </Dialog>
  );
}
