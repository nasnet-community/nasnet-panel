import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
} from '@nasnet/ui';
import {
  ApiError,
  createWireguardPeer,
  type CreateWireguardPeerRequest,
  type CreateWireguardPeerResponse,
  type VPNCredentials,
} from '../../../api';
import { isPort } from '../../../utils/validators';

interface Props {
  creds: VPNCredentials | null;
  interfaceName: string;
  onCancel: () => void;
  onCreated: (created: CreateWireguardPeerResponse) => void;
}

export function AddWgPeerDialog({ creds, interfaceName, onCancel, onCreated }: Props) {
  const [name, setName] = useState('');
  const [endpointAddress, setEndpointAddress] = useState('');
  const [endpointPort, setEndpointPort] = useState('51820');
  const [allowedAddresses, setAllowedAddresses] = useState('0.0.0.0/0');
  const [publicKey, setPublicKey] = useState('');
  const [presharedKey, setPresharedKey] = useState('');
  const [persistentKeepalive, setPersistentKeepalive] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(
    () => ({
      endpointPort:
        endpointAddress.trim() === '' || isPort(endpointPort) ? null : 'Port must be 1-65535.',
      allowedAddresses: allowedAddresses.trim() === '' ? 'Allowed addresses is required.' : null,
      persistentKeepalive:
        persistentKeepalive.trim() === '' ||
        (Number.isInteger(Number(persistentKeepalive)) && Number(persistentKeepalive) > 0)
          ? null
          : 'Keepalive must be a positive integer.',
    }),
    [endpointAddress, endpointPort, allowedAddresses, persistentKeepalive],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!creds && !submitting && !hasErrors;

  const submit = async () => {
    setTouched({
      endpointPort: true,
      allowedAddresses: true,
      persistentKeepalive: true,
    });
    if (!canSubmit || !creds) return;
    setError(null);
    setSubmitting(true);

    const body: CreateWireguardPeerRequest = {
      interfaceName,
      allowedAddresses: allowedAddresses.trim(),
    };
    if (endpointAddress.trim()) {
      body.endpointAddress = endpointAddress.trim();
      body.endpointPort = Number(endpointPort);
    }
    if (name.trim()) body.name = name.trim();
    if (publicKey.trim()) body.publicKey = publicKey.trim();
    else body.savePrivateKey = true;
    if (presharedKey.trim()) body.preSharedKey = presharedKey.trim();
    if (persistentKeepalive.trim()) body.persistentKeepalive = Number(persistentKeepalive);

    let created: CreateWireguardPeerResponse;
    try {
      created = await createWireguardPeer(creds, body);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create WireGuard peer.';
      setError(message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onCreated(created);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={`Add peer to ${interfaceName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting ? 'Creating…' : 'Create peer'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>Name (optional)</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="auto-generated if empty"
              aria-label="Name"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>Endpoint address (optional)</span>
            <Input
              value={endpointAddress}
              onChange={(e) => setEndpointAddress(e.target.value)}
              placeholder="203.0.113.50"
              aria-label="Endpoint address"
            />
          </Label>
          <Label>
            <span>Endpoint port</span>
            <Input
              value={endpointPort}
              onChange={(e) => setEndpointPort(e.target.value)}
              onBlur={() => markTouched('endpointPort')}
              inputMode="numeric"
              aria-label="Endpoint port"
              aria-invalid={touched.endpointPort && !!errors.endpointPort}
            />
            {touched.endpointPort && errors.endpointPort ? (
              <FormError>{errors.endpointPort}</FormError>
            ) : null}
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>Allowed addresses</span>
            <Input
              value={allowedAddresses}
              onChange={(e) => setAllowedAddresses(e.target.value)}
              onBlur={() => markTouched('allowedAddresses')}
              placeholder="10.8.0.2/32"
              aria-label="Allowed addresses"
              aria-invalid={touched.allowedAddresses && !!errors.allowedAddresses}
            />
            {touched.allowedAddresses && errors.allowedAddresses ? (
              <FormError>{errors.allowedAddresses}</FormError>
            ) : null}
          </Label>
          <Label>
            <span>Persistent keepalive (s)</span>
            <Input
              value={persistentKeepalive}
              onChange={(e) => setPersistentKeepalive(e.target.value)}
              onBlur={() => markTouched('persistentKeepalive')}
              placeholder="empty = off"
              inputMode="numeric"
              aria-label="Persistent keepalive"
              aria-invalid={touched.persistentKeepalive && !!errors.persistentKeepalive}
            />
            {touched.persistentKeepalive && errors.persistentKeepalive ? (
              <FormError>{errors.persistentKeepalive}</FormError>
            ) : null}
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>Public key (peer)</span>
            <Input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="leave empty to auto-generate keypair"
              aria-label="Public key"
            />
          </Label>
          <Label>
            <span>Preshared key</span>
            <PasswordInput
              value={presharedKey}
              onChange={(e) => setPresharedKey(e.target.value)}
              placeholder="leave empty to auto-generate"
              aria-label="Preshared key"
              autoComplete="off"
            />
          </Label>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
