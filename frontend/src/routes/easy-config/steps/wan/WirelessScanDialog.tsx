import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Dialog, Label, PasswordInput, Select } from '@nasnet/ui';
import { scanWifiAccessPoints, type WifiAccessPointResponse } from '../../../../api';
import { useSession } from '../../../../state/SessionContext';
import { useRouter } from '../../../../state/RouterStoreContext';
import { verifyWirelessPassword } from './wirelessScanMock';
import styles from './WirelessScanDialog.module.scss';

interface Props {
  open: boolean;
  interfaceName: string;
  onClose: () => void;
  onConnected: (ssid: string, password: string) => void;
}

function isOpenSecurity(security?: string): boolean {
  const s = (security ?? '').toLowerCase();
  return s === '' || s === 'none' || s === 'open';
}

function securityLabel(security?: string): string {
  const s = (security ?? '').toLowerCase();
  if (isOpenSecurity(s)) return 'Open';
  if (s.includes('wpa3')) return 'WPA3';
  if (s.includes('wpa2')) return 'WPA2';
  if (s.includes('wpa')) return 'WPA';
  if (s.includes('wep')) return 'WEP';
  return s.toUpperCase();
}

function signalNumber(signal?: string): number {
  const n = Number((signal ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
}

export function WirelessScanDialog({ open, interfaceName, onClose, onConnected }: Props) {
  const { id: routerId } = useParams<{ id: string }>();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);

  const [networks, setNetworks] = useState<WifiAccessPointResponse[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSsid('');
    setPassword('');
    setError(null);
    setScanError(null);

    const creds = routerId ? getCredentials(routerId) : undefined;
    const host = router?.host;
    if (!creds || !host || !interfaceName) {
      setNetworks([]);
      setScanError('Missing router credentials or interface.');
      return;
    }

    const controller = new AbortController();
    setScanning(true);
    void scanWifiAccessPoints({ host, ...creds }, interfaceName, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        const sorted = [...list].sort((a, b) => signalNumber(b.signal) - signalNumber(a.signal));
        setNetworks(sorted);
        setScanning(false);
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setNetworks([]);
        setScanError(err?.message || 'Failed to scan networks.');
        setScanning(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, routerId, router?.host, interfaceName, getCredentials]);

  const options = useMemo(
    () => [
      { value: '', label: scanning ? 'Scanning networks…' : 'Select a network' },
      ...networks
        .filter((n) => n.ssid)
        .map((n) => ({
          value: n.ssid as string,
          label: `${n.ssid} (${securityLabel(n.security)})`,
        })),
    ],
    [networks, scanning],
  );

  const selected = networks.find((n) => n.ssid === ssid) ?? null;
  const isOpenNetwork = isOpenSecurity(selected?.security);
  const canVerify = Boolean(selected) && (isOpenNetwork || password.length >= 8);

  const onVerify = async () => {
    if (!selected || !selected.ssid) return;
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
        {scanError ? <p className={styles.error}>{scanError}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </Dialog>
  );
}
