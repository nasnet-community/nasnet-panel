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
  Switch,
} from '@nasnet/ui';
import {
  ApiError,
  updateWireguardPeer,
  type UpdateWireguardPeerRequest,
  type VPNCredentials,
  type WireguardPeerResponse,
} from '../../../api';
import { isPort } from '../../../utils/validators';

interface Draft {
  name: string;
  endpointAddress: string;
  endpointPort: string;
  allowedAddresses: string;
  preSharedKey: string;
  persistentKeepalive: string;
  comment: string;
  disabled: boolean;
}

interface Props {
  creds: VPNCredentials | null;
  peer: WireguardPeerResponse;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditWgPeerDialog({ creds, peer, onCancel, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft>({
    name: peer.name,
    endpointAddress: peer.endpointAddress,
    endpointPort: String(peer.endpointPort ?? ''),
    allowedAddresses: peer.allowedAddresses,
    preSharedKey: peer.preSharedKey ?? '',
    persistentKeepalive:
      peer.persistentKeepalive && peer.persistentKeepalive !== '0' ? peer.persistentKeepalive : '',
    comment: '',
    disabled: peer.disabled,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(
    () => ({
      endpointPort:
        draft.endpointPort.trim() === '' || isPort(draft.endpointPort)
          ? null
          : 'Port must be 1-65535.',
      persistentKeepalive:
        draft.persistentKeepalive.trim() === '' ||
        (Number.isInteger(Number(draft.persistentKeepalive)) &&
          Number(draft.persistentKeepalive) > 0)
          ? null
          : 'Keepalive must be a positive integer.',
    }),
    [draft.endpointPort, draft.persistentKeepalive],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!creds && !submitting && !hasErrors;

  const handleSubmit = async () => {
    setTouched({ endpointPort: true, persistentKeepalive: true });
    if (!canSubmit || !creds) return;
    setError(null);
    setSubmitting(true);

    const body: UpdateWireguardPeerRequest = {};
    if (draft.name !== peer.name) body.name = draft.name;
    if (draft.endpointAddress !== peer.endpointAddress) {
      body.endpointAddress = draft.endpointAddress;
    }
    if (draft.endpointPort.trim() !== '' && Number(draft.endpointPort) !== peer.endpointPort) {
      body.endpointPort = Number(draft.endpointPort);
    }
    if (draft.allowedAddresses !== peer.allowedAddresses) {
      body.allowedAddresses = draft.allowedAddresses;
    }
    if (draft.preSharedKey !== (peer.preSharedKey ?? '')) {
      body.preSharedKey = draft.preSharedKey;
    }
    if (draft.persistentKeepalive.trim() !== '') {
      body.persistentKeepalive = Number(draft.persistentKeepalive);
    }
    if (draft.comment !== '') body.comment = draft.comment;
    if (draft.disabled !== peer.disabled) body.disabled = draft.disabled;

    try {
      await updateWireguardPeer(creds, peer.id || peer.name, body);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update WireGuard peer.';
      setError(message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSaved();
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={`Edit peer - ${peer.name}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>Name</span>
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="off"
              aria-label="Name"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>Endpoint address</span>
            <Input
              value={draft.endpointAddress}
              onChange={(e) => set('endpointAddress', e.target.value)}
              autoComplete="off"
              aria-label="Endpoint address"
            />
          </Label>
          <Label>
            <span>Endpoint port</span>
            <Input
              value={draft.endpointPort}
              onChange={(e) => set('endpointPort', e.target.value)}
              onBlur={() => markTouched('endpointPort')}
              inputMode="numeric"
              autoComplete="off"
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
              value={draft.allowedAddresses}
              onChange={(e) => set('allowedAddresses', e.target.value)}
              autoComplete="off"
              aria-label="Allowed addresses"
            />
          </Label>
          <Label>
            <span>Persistent keepalive (s)</span>
            <Input
              value={draft.persistentKeepalive}
              onChange={(e) => set('persistentKeepalive', e.target.value)}
              onBlur={() => markTouched('persistentKeepalive')}
              placeholder="empty = off"
              inputMode="numeric"
              autoComplete="off"
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
            <span>Preshared key</span>
            <PasswordInput
              value={draft.preSharedKey}
              onChange={(e) => set('preSharedKey', e.target.value)}
              aria-label="Preshared key"
              autoComplete="new-password"
            />
          </Label>
          <Label>
            <span>Comment</span>
            <Input
              value={draft.comment}
              onChange={(e) => set('comment', e.target.value)}
              placeholder="leave empty to keep current"
              autoComplete="off"
              aria-label="Comment"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label as="div">
            <Switch
              label="Enabled"
              checked={!draft.disabled}
              onChange={(e) => set('disabled', !e.target.checked)}
            />
          </Label>
        </FieldRow>
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
