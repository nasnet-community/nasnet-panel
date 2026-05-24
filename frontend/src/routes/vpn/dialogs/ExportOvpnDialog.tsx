import { useMemo, useState } from 'react';
import { Button, Dialog, FieldRow, FieldStack, FormError, Input, Label } from '@nasnet/ui';
import { ApiError, exportOvpnClient, type VPNCredentials } from '../../../api';
import { validateHostOrIp } from '../../../utils/validators';

interface Props {
  creds: VPNCredentials | null;
  serverName: string;
  defaultPublicAddress?: string;
  onClose: () => void;
}

export function ExportOvpnDialog({ creds, serverName, defaultPublicAddress, onClose }: Props) {
  const [publicAddress, setPublicAddress] = useState(defaultPublicAddress ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const addressError = useMemo(() => validateHostOrIp(publicAddress), [publicAddress]);
  const canSubmit = !!creds && !submitting && !addressError;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit || !creds) return;
    setError(null);
    setSubmitting(true);
    try {
      const { filename, content } = await exportOvpnClient(creds, serverName, publicAddress.trim());
      triggerDownload(filename, content);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to export client config.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onClose}
      title={`Export OpenVPN client - ${serverName}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? 'Exporting…' : 'Download .ovpn'}
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
              placeholder="vpn.example.com or 203.0.113.10"
              aria-label="Public address"
              aria-invalid={touched && !!addressError}
            />
            {touched && addressError ? <FormError>{addressError}</FormError> : null}
          </Label>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/x-openvpn-profile' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
