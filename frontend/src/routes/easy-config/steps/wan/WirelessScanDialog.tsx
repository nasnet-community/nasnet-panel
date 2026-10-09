import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Label, PasswordInput, Select } from '@nasnet/ui';
import { scanWifiAccessPoints, type WifiAccessPointResponse } from '../../../../api';
import { useSession } from '../../../../state/SessionContext';
import { useRouter } from '../../../../state/RouterStoreContext';
import { messageText, type Message } from '../../state';
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

function securityLabel(openLabel: string, security?: string): string {
  const s = (security ?? '').toLowerCase();
  if (isOpenSecurity(s)) return openLabel;
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
  const { t } = useTranslation('easyConfig');
  const { id: routerId } = useParams<{ id: string }>();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);

  const [networks, setNetworks] = useState<WifiAccessPointResponse[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<Message | null>(null);
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
      setScanError({ key: 'wan.scan.missingCredentials' });
      return;
    }

    const controller = new AbortController();
    setScanning(true);
    void scanWifiAccessPoints({ host, ...creds }, interfaceName, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return;
        const sorted = [...list].sort((a, b) => signalNumber(b.signal) - signalNumber(a.signal));
        const seen = new Set<string>();
        const unique = sorted.filter((n) => {
          if (!n.ssid || seen.has(n.ssid)) return false;
          seen.add(n.ssid);
          return true;
        });
        setNetworks(unique);
        setScanning(false);
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setNetworks([]);
        setScanError(err?.message ? { text: err.message } : { key: 'wan.scan.scanFailed' });
        setScanning(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, routerId, router?.host, interfaceName, getCredentials]);

  const scanningLabel = t('wan.scan.scanningOption');
  const selectLabel = t('wan.scan.selectNetwork');
  const openLabel = t('wan.scan.open');
  const options = useMemo(
    () => [
      { value: '', label: scanning ? scanningLabel : selectLabel },
      ...networks
        .filter((n) => n.ssid)
        .map((n) => ({
          value: n.ssid as string,
          label: `${n.ssid} (${securityLabel(openLabel, n.security)})`,
        })),
    ],
    [networks, scanning, scanningLabel, selectLabel, openLabel],
  );

  const selected = networks.find((n) => n.ssid === ssid) ?? null;
  const canVerify = Boolean(selected);

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
      title={t('wan.scan.title')}
      description={t('wan.scan.description')}
      labelledBy="wireless-scan-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={verifying}>
            {t('wan.scan.cancel')}
          </Button>
          <Button variant="success" onClick={onVerify} loading={verifying} disabled={!canVerify}>
            {t('wan.scan.verify')}
          </Button>
        </>
      }
    >
      <div className={styles.connect}>
        <Label>
          <span>{t('wan.scan.network')}</span>
          <Select
            aria-label={t('wan.scan.networkAria')}
            value={ssid}
            onChange={(v) => {
              setSsid(v);
              setPassword('');
              setError(null);
            }}
            options={options}
            searchable
            searchPlaceholder={t('wan.scan.search')}
            maxOptionsHeight={126}
            disabled={scanning}
          />
        </Label>
        {scanning ? (
          <div className={styles.scanning} role="status">
            <span className={styles.spinner} aria-hidden />
            <span>{t('wan.scan.scanning')}</span>
          </div>
        ) : null}
        {selected ? (
          <Label>
            <span>{t('wan.scan.passwordOptional')}</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label={t('wan.scan.passwordAria')}
            />
          </Label>
        ) : null}
        {scanError ? <p className={styles.error}>{messageText(scanError)}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </Dialog>
  );
}
