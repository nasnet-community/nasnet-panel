import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import {
  Button,
  Code,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  useToast,
} from '@nasnet/ui';
import {
  ApiError,
  exportWireguardPeerConfig,
  isAbortError,
  type VPNCredentials,
} from '../../../api';
import { validateHostOrIp } from '../../../utils/validators';

interface Props {
  creds: VPNCredentials | null;
  peerName: string;
  peerNameOrID: string;
  defaultPublicAddress?: string;
  onClose: () => void;
}

export function WgClientConfigDialog({
  creds,
  peerName,
  peerNameOrID,
  defaultPublicAddress,
  onClose,
}: Props) {
  const [publicAddress, setPublicAddress] = useState(defaultPublicAddress ?? '');
  const [requestedAddress, setRequestedAddress] = useState(defaultPublicAddress?.trim() ?? '');
  const [requestNonce, setRequestNonce] = useState(0);
  const [config, setConfig] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const toast = useToast();
  const { t } = useTranslation('vpn');

  const addressError = useMemo(() => validateHostOrIp(publicAddress), [publicAddress]);
  const canLoad = !!creds && !loading && !addressError;

  useEffect(() => {
    if (!creds || !requestedAddress) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setConfig('');

    (async () => {
      try {
        const result = await exportWireguardPeerConfig(
          creds,
          peerNameOrID,
          requestedAddress,
          controller.signal,
        );
        setConfig(result.config);
        setFilename(result.filename);
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('ovpnExport.failed');
        setConfig('');
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, peerNameOrID, requestedAddress, requestNonce, t]);

  const load = () => {
    setTouched(true);
    if (!canLoad || (publicAddress.trim() === requestedAddress && !error)) return;
    setRequestedAddress(publicAddress.trim());
    setRequestNonce((n) => n + 1);
  };

  const download = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${peerName}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config);
      toast.notify({ title: t('wgConfig.copied'), tone: 'success' });
    } catch {
      toast.notify({ title: t('wgConfig.copyFailed'), tone: 'danger' });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('wgConfig.title', { name: peerName })}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('shared.close')}
          </Button>
          <Button variant="secondary" onClick={copy} disabled={!config || loading}>
            {t('shared.copy')}
          </Button>
          <Button onClick={download} disabled={!config || loading}>
            {t('wgConfig.download')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>{t('ovpnExport.serverAddress')}</span>
            <Input
              value={publicAddress}
              onChange={(e) => setPublicAddress(e.target.value)}
              onBlur={load}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) load();
              }}
              placeholder="203.0.113.10"
              aria-label={t('ovpnExport.serverAddress')}
              dir="ltr"
              aria-invalid={touched && !!addressError}
            />
            {touched && addressError ? <FormError>{addressError}</FormError> : null}
          </Label>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
        {config ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                <QRCodeSVG value={config} size={216} marginSize={0} />
              </div>
            </div>
            <Code dir="ltr" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {config}
            </Code>
          </>
        ) : null}
      </FieldStack>
    </Dialog>
  );
}
