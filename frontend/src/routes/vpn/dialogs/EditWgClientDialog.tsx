import { useEffect, useMemo, useState } from 'react';
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
  fetchWireguardDetailed,
  isAbortError,
  updateWireguardInterface,
  updateWireguardPeer,
  type UpdateWireguardInterfaceRequest,
  type UpdateWireguardPeerRequest,
  type VPNClient,
  type VPNCredentials,
  type WireguardDetailedResponse,
  type WireguardPeerResponse,
} from '../../../api';
import { isPort } from '../../../utils/validators';

interface Draft {
  // interface
  comment: string;
  mtu: string;
  listenPort: string;
  interfacePrivateKey: string;
  disabled: boolean;
  // peer
  endpointAddress: string;
  endpointPort: string;
  allowedAddresses: string;
  persistentKeepalive: string;
  preSharedKey: string;
  peerPublicKey: string;
}

interface Props {
  creds: VPNCredentials | null;
  client: VPNClient;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditWgClientDialog({ creds, client, onCancel, onSaved }: Props) {
  const [details, setDetails] = useState<WireguardDetailedResponse | null>(null);
  const [peer, setPeer] = useState<WireguardPeerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!creds) {
      setLoading(false);
      setLoadError('Not connected to router.');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const data = await fetchWireguardDetailed(creds, client.name, controller.signal);
        setDetails(data);
        const firstPeer = data.peers[0] ?? null;
        setPeer(firstPeer);
        setDraft({
          comment: data.comment ?? '',
          mtu: data.mtu ? String(data.mtu) : '',
          listenPort: data.listenPort ? String(data.listenPort) : '',
          interfacePrivateKey: '',
          disabled: data.disabled,
          endpointAddress: firstPeer?.endpointAddress ?? '',
          endpointPort: firstPeer?.endpointPort ? String(firstPeer.endpointPort) : '',
          allowedAddresses: firstPeer?.allowedAddresses ?? '',
          persistentKeepalive:
            firstPeer?.persistentKeepalive && firstPeer.persistentKeepalive !== '0'
              ? firstPeer.persistentKeepalive
              : '',
          preSharedKey: '',
          peerPublicKey: '',
        });
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load WireGuard client.';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, client.name]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const errors = useMemo(() => {
    if (!draft) {
      return {
        listenPort: null,
        mtu: null,
        endpointPort: null,
        persistentKeepalive: null,
      };
    }
    return {
      listenPort:
        draft.listenPort.trim() === '' || isPort(draft.listenPort) ? null : 'Port must be 1-65535.',
      mtu:
        draft.mtu.trim() === '' || (Number.isInteger(Number(draft.mtu)) && Number(draft.mtu) > 0)
          ? null
          : 'MTU must be a positive integer.',
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
    };
  }, [draft]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!draft && !!details && !!creds && !submitting;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !draft || !details || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);

    const ifaceBody: UpdateWireguardInterfaceRequest = {};
    if (draft.disabled !== details.disabled) ifaceBody.disabled = draft.disabled;
    if (draft.comment !== (details.comment ?? '')) ifaceBody.comment = draft.comment;
    if (draft.mtu.trim() !== '' && Number(draft.mtu) !== details.mtu) {
      ifaceBody.mtu = Number(draft.mtu);
    }
    if (draft.listenPort.trim() !== '' && Number(draft.listenPort) !== details.listenPort) {
      ifaceBody.listenPort = Number(draft.listenPort);
    }
    if (draft.interfacePrivateKey.trim() !== '') {
      ifaceBody.privateKey = draft.interfacePrivateKey.trim();
    }

    const peerBody: UpdateWireguardPeerRequest = {};
    if (peer) {
      if (draft.endpointAddress !== peer.endpointAddress) {
        peerBody.endpointAddress = draft.endpointAddress;
      }
      if (draft.endpointPort.trim() !== '' && Number(draft.endpointPort) !== peer.endpointPort) {
        peerBody.endpointPort = Number(draft.endpointPort);
      }
      if (draft.allowedAddresses !== peer.allowedAddresses) {
        peerBody.allowedAddresses = draft.allowedAddresses;
      }
      if (draft.persistentKeepalive.trim() !== '') {
        peerBody.persistentKeepalive = Number(draft.persistentKeepalive);
      }
      if (draft.preSharedKey.trim() !== '') {
        peerBody.preSharedKey = draft.preSharedKey.trim();
      }
      if (draft.peerPublicKey.trim() !== '') {
        peerBody.publicKey = draft.peerPublicKey.trim();
      }
    }

    try {
      if (Object.keys(ifaceBody).length > 0) {
        await updateWireguardInterface(creds, client.name, ifaceBody);
      }
      if (peer && Object.keys(peerBody).length > 0) {
        await updateWireguardPeer(creds, peer.id || peer.name, peerBody);
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update WireGuard client.';
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
      title={`Edit WireGuard client - ${client.name}`}
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
      {loading ? (
        <p>Loading…</p>
      ) : loadError ? (
        <FormError role="alert">{loadError}</FormError>
      ) : draft ? (
        <FieldStack>
          <FieldRow>
            <Label>
              <span>Name</span>
              <Input value={client.name} disabled aria-label="Name" />
            </Label>
            <Label>
              <span>Listen port</span>
              <Input
                value={draft.listenPort}
                onChange={(e) => set('listenPort', e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                aria-label="Listen port"
                aria-invalid={submitAttempted && !!errors.listenPort}
              />
              {submitAttempted && errors.listenPort ? (
                <FormError>{errors.listenPort}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>MTU</span>
              <Input
                value={draft.mtu}
                onChange={(e) => set('mtu', e.target.value)}
                placeholder="leave empty to keep current"
                inputMode="numeric"
                autoComplete="off"
                aria-label="MTU"
                aria-invalid={submitAttempted && !!errors.mtu}
              />
              {submitAttempted && errors.mtu ? <FormError>{errors.mtu}</FormError> : null}
            </Label>
            <Label>
              <span>Comment</span>
              <Input
                value={draft.comment}
                onChange={(e) => set('comment', e.target.value)}
                placeholder="optional"
                autoComplete="off"
                aria-label="Comment"
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>Interface private key (replace)</span>
              <PasswordInput
                value={draft.interfacePrivateKey}
                onChange={(e) => set('interfacePrivateKey', e.target.value)}
                placeholder="leave empty to keep current"
                aria-label="Interface private key"
                autoComplete="new-password"
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
          {peer ? (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
              <strong>Peer ({peer.name})</strong>
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
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label="Endpoint port"
                    aria-invalid={submitAttempted && !!errors.endpointPort}
                  />
                  {submitAttempted && errors.endpointPort ? (
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
                    placeholder="0.0.0.0/0"
                    autoComplete="off"
                    aria-label="Allowed addresses"
                  />
                </Label>
                <Label>
                  <span>Persistent keepalive (s)</span>
                  <Input
                    value={draft.persistentKeepalive}
                    onChange={(e) => set('persistentKeepalive', e.target.value)}
                    placeholder="empty = off"
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label="Persistent keepalive"
                    aria-invalid={submitAttempted && !!errors.persistentKeepalive}
                  />
                  {submitAttempted && errors.persistentKeepalive ? (
                    <FormError>{errors.persistentKeepalive}</FormError>
                  ) : null}
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>Peer public key (replace)</span>
                  <Input
                    value={draft.peerPublicKey}
                    onChange={(e) => set('peerPublicKey', e.target.value)}
                    placeholder="leave empty to keep current"
                    autoComplete="off"
                    aria-label="Peer public key"
                  />
                </Label>
                <Label>
                  <span>Preshared key (replace)</span>
                  <PasswordInput
                    value={draft.preSharedKey}
                    onChange={(e) => set('preSharedKey', e.target.value)}
                    placeholder="leave empty to keep current"
                    aria-label="Preshared key"
                    autoComplete="new-password"
                  />
                </Label>
              </FieldRow>
            </>
          ) : (
            <p style={{ color: 'var(--color-muted)' }}>This WireGuard client has no peers.</p>
          )}
          {error ? <FormError role="alert">{error}</FormError> : null}
        </FieldStack>
      ) : null}
    </Dialog>
  );
}
