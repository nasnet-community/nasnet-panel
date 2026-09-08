import { useEffect, useMemo, useState } from 'react';
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
  const [config, setConfig] = useState('');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const toast = useToast();

  const addressError = useMemo(() => validateHostOrIp(publicAddress), [publicAddress]);
  const canLoad = !!creds && !loading && !addressError;

  useEffect(() => {
    if (!creds || !requestedAddress) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

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
              : 'Failed to export client config.';
        setConfig('');
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, peerNameOrID, requestedAddress]);

  const load = () => {
    setTouched(true);
    if (!canLoad) return;
    setRequestedAddress(publicAddress.trim());
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
      toast.notify({ title: 'Config copied to clipboard', tone: 'success' });
    } catch {
      toast.notify({ title: 'Failed to copy config', tone: 'danger' });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Client config - ${peerName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={copy} disabled={!config}>
            Copy
          </Button>
          <Button onClick={download} disabled={!config}>
            Download .conf
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>Server public address</span>
            <Input
              value={publicAddress}
              onChange={(e) => setPublicAddress(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="203.0.113.10"
              aria-label="Server public address"
              aria-invalid={touched && !!addressError}
            />
            {touched && addressError ? <FormError>{addressError}</FormError> : null}
          </Label>
          <Button variant="secondary" onClick={load} disabled={!canLoad}>
            {loading ? 'Generating…' : 'Generate'}
          </Button>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
        {config ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                <QRCodeSVG value={config} size={216} marginSize={0} />
              </div>
            </div>
            <Code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{config}</Code>
          </>
        ) : null}
      </FieldStack>
    </Dialog>
  );
}
