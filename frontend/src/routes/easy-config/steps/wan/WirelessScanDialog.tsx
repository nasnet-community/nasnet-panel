import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Label, PasswordInput, Select } from '@nasnet/ui';
import {
  scanWirelessNetworks,
  verifyWirelessPassword,
  type WirelessNetwork,
} from './wirelessScanMock';
import styles from './WirelessScanDialog.module.scss';

interface Props {
  open: boolean;
  onClose: () => void;
  onConnected: (ssid: string, password: string) => void;
}

function securityLabel(s: WirelessNetwork['security']): string {
  if (s === 'open') return 'Open';
  if (s === 'wpa2') return 'WPA2';
  return 'WPA3';
}

export function WirelessScanDialog({ open, onClose, onConnected }: Props) {
  const [networks, setNetworks] = useState<WirelessNetwork[]>([]);
  const [scanning, setScanning] = useState(false);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSsid('');
    setPassword('');
    setError(null);
    let cancelled = false;
    setScanning(true);
    void scanWirelessNetworks().then((list) => {
      if (cancelled) return;
      setNetworks(list);
      setScanning(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const options = useMemo(
    () => [
      { value: '', label: scanning ? 'Scanning networks…' : 'Select a network' },
      ...networks.map((n) => ({
        value: n.ssid,
        label: `${n.ssid} (${securityLabel(n.security)} · ${n.band.toUpperCase()})`,
      })),
    ],
    [networks, scanning],
  );

  const selected = networks.find((n) => n.ssid === ssid) ?? null;
  const isOpenNetwork = selected?.security === 'open';
  const canVerify = Boolean(selected) && (isOpenNetwork || password.length >= 8);

  const onVerify = async () => {
    if (!selected) return;
    setVerifying(true);
    setError(null);
    const result = await verifyWirelessPassword(selected.ssid, password);
    setVerifying(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    onConnected(selected.ssid, password);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={verifying ? () => undefined : onClose}
      size="md"
      title="Choose a wireless network"
      description="Pick a network within range and enter its password."
      labelledBy="wireless-scan-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={verifying}>
            Cancel
          </Button>
          <Button variant="success" onClick={onVerify} loading={verifying} disabled={!canVerify}>
            Verify and connect
          </Button>
        </>
      }
    >
      <div className={styles.connect}>
        <Label>
          <span>Network</span>
          <Select
            aria-label="Wireless network"
            value={ssid}
            onChange={(v) => {
              setSsid(v);
              setPassword('');
              setError(null);
            }}
            options={options}
            searchable
            searchPlaceholder="Search networks…"
            maxOptionsHeight={126}
            disabled={scanning}
          />
        </Label>
        {selected && !isOpenNetwork ? (
          <Label>
            <span>Password</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Wireless password"
            />
          </Label>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </Dialog>
  );
}
