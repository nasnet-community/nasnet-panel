import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Button,
  ConfirmDialog,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
  Switch,
  useToast,
} from '@nasnet/ui';
import { Trash2 } from 'lucide-react';
import {
  ApiError,
  deleteWireguardPeer,
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

interface PeerDraft {
  endpointAddress: string;
  endpointPort: string;
  allowedAddresses: string;
  persistentKeepalive: string;
  preSharedKey: string;
  peerPublicKey: string;
}

interface Draft {
  // interface
  comment: string;
  mtu: string;
  listenPort: string;
  interfacePrivateKey: string;
  disabled: boolean;
  peers: PeerDraft[];
}

interface Props {
  creds: VPNCredentials | null;
  client: VPNClient;
  onCancel: () => void;
  onSaved: (changes: { comment: string; disabled: boolean }) => void;
}

export function EditWgClientDialog({ creds, client, onCancel, onSaved }: Props) {
  const [details, setDetails] = useState<WireguardDetailedResponse | null>(null);
  const [peers, setPeers] = useState<WireguardPeerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [pendingDeletePeer, setPendingDeletePeer] = useState<WireguardPeerResponse | null>(null);
  const [peerDeleteSubmitting, setPeerDeleteSubmitting] = useState(false);
  const toast = useToast();

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
        const loadedPeers = data.peers ?? [];
        setPeers(loadedPeers);
        setDraft({
          comment: data.comment || client.name,
          mtu: data.mtu ? String(data.mtu) : '',
          listenPort: data.listenPort ? String(data.listenPort) : '',
          interfacePrivateKey: '',
          disabled: data.disabled,
          peers: loadedPeers.map((p) => ({
            endpointAddress: p.endpointAddress ?? '',
            endpointPort: p.endpointPort ? String(p.endpointPort) : '',
            allowedAddresses: p.allowedAddresses ?? '',
            persistentKeepalive:
              p.persistentKeepalive && p.persistentKeepalive !== '0' ? p.persistentKeepalive : '',
            preSharedKey: '',
            peerPublicKey: '',
          })),
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

  const setPeerField = <K extends keyof PeerDraft>(index: number, key: K, value: PeerDraft[K]) =>
    setDraft((d) =>
      d ? { ...d, peers: d.peers.map((p, i) => (i === index ? { ...p, [key]: value } : p)) } : d,
    );

  const errors = useMemo(() => {
    if (!draft) {
      return {
        listenPort: null,
        mtu: null,
        peers: [],
      };
    }
    return {
      listenPort:
        draft.listenPort.trim() === '' || isPort(draft.listenPort) ? null : 'Port must be 1-65535.',
      mtu:
        draft.mtu.trim() === '' || (Number.isInteger(Number(draft.mtu)) && Number(draft.mtu) > 0)
          ? null
          : 'MTU must be a positive integer.',
      peers: draft.peers.map((p) => ({
        endpointPort:
          p.endpointPort.trim() === '' || isPort(p.endpointPort) ? null : 'Port must be 1-65535.',
        persistentKeepalive:
          p.persistentKeepalive.trim() === '' ||
          (Number.isInteger(Number(p.persistentKeepalive)) && Number(p.persistentKeepalive) > 0)
            ? null
            : 'Keepalive must be a positive integer.',
      })),
    };
  }, [draft]);

  const hasErrors =
    !!errors.listenPort ||
    !!errors.mtu ||
    errors.peers.some((p) => !!p.endpointPort || !!p.persistentKeepalive);
  const canSubmit = !!draft && !!details && !!creds && !submitting;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !draft || !details || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);

    const ifaceBody: UpdateWireguardInterfaceRequest = {};
    if (draft.disabled !== details.disabled) ifaceBody.disabled = draft.disabled;
    if (draft.comment !== (details.comment || client.name)) ifaceBody.comment = draft.comment;
    if (draft.mtu.trim() !== '' && Number(draft.mtu) !== details.mtu) {
      ifaceBody.mtu = Number(draft.mtu);
    }
    if (draft.listenPort.trim() !== '' && Number(draft.listenPort) !== details.listenPort) {
      ifaceBody.listenPort = Number(draft.listenPort);
    }
    if (draft.interfacePrivateKey.trim() !== '') {
      ifaceBody.privateKey = draft.interfacePrivateKey.trim();
    }

    const peerUpdates = peers.map((peer, index) => {
      const peerDraft = draft.peers[index];
      const peerBody: UpdateWireguardPeerRequest = {};
      if (peerDraft.endpointAddress !== peer.endpointAddress) {
        peerBody.endpointAddress = peerDraft.endpointAddress;
      }
      if (
        peerDraft.endpointPort.trim() !== '' &&
        Number(peerDraft.endpointPort) !== peer.endpointPort
      ) {
        peerBody.endpointPort = Number(peerDraft.endpointPort);
      }
      if (peerDraft.allowedAddresses !== peer.allowedAddresses) {
        peerBody.allowedAddresses = peerDraft.allowedAddresses;
      }
      if (peerDraft.persistentKeepalive.trim() !== '') {
        peerBody.persistentKeepalive = Number(peerDraft.persistentKeepalive);
      }
      if (peerDraft.preSharedKey.trim() !== '') {
        peerBody.preSharedKey = peerDraft.preSharedKey.trim();
      }
      if (peerDraft.peerPublicKey.trim() !== '') {
        peerBody.publicKey = peerDraft.peerPublicKey.trim();
      }
      return { peer, peerBody };
    });

    try {
      if (Object.keys(ifaceBody).length > 0) {
        await updateWireguardInterface(creds, client.name, ifaceBody);
      }
      for (const { peer, peerBody } of peerUpdates) {
        if (Object.keys(peerBody).length > 0) {
          await updateWireguardPeer(creds, peer.id || peer.name, peerBody);
        }
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
    onSaved({ comment: draft.comment, disabled: draft.disabled });
  };

  const onConfirmDeletePeer = async () => {
    if (!creds || !pendingDeletePeer) return;
    const target = pendingDeletePeer;
    setPeerDeleteSubmitting(true);
    try {
      await deleteWireguardPeer(creds, target.id || target.name);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete peer.';
      toast.notify({ title: 'Failed to delete peer', description: message, tone: 'danger' });
      setPeerDeleteSubmitting(false);
      return;
    }
    const index = peers.indexOf(target);
    setPeers((prev) => prev.filter((p) => p !== target));
    setDraft((d) => (d ? { ...d, peers: d.peers.filter((_, i) => i !== index) } : d));
    setPeerDeleteSubmitting(false);
    setPendingDeletePeer(null);
    toast.notify({ title: `Peer "${target.name}" deleted`, tone: 'info' });
  };

  return (
    <>
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
                <Input
                  value={draft.comment}
                  onChange={(e) => set('comment', e.target.value)}
                  placeholder="optional"
                  autoComplete="off"
                  aria-label="Name"
                />
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
            {peers.length > 0 ? (
              peers.map((peer, index) => (
                <Fragment key={peer.id || peer.name}>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <strong>Peer ({peer.name})</strong>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={submitting || peers.length <= 1}
                      title={
                        peers.length <= 1
                          ? 'A WireGuard client needs at least one peer'
                          : `Delete ${peer.name}`
                      }
                      aria-label={`Delete peer ${peer.name}`}
                      onClick={() => setPendingDeletePeer(peer)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  </div>
                  <FieldRow>
                    <Label>
                      <span>Endpoint address</span>
                      <Input
                        value={draft.peers[index].endpointAddress}
                        onChange={(e) => setPeerField(index, 'endpointAddress', e.target.value)}
                        autoComplete="off"
                        aria-label="Endpoint address"
                      />
                    </Label>
                    <Label>
                      <span>Endpoint port</span>
                      <Input
                        value={draft.peers[index].endpointPort}
                        onChange={(e) => setPeerField(index, 'endpointPort', e.target.value)}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label="Endpoint port"
                        aria-invalid={submitAttempted && !!errors.peers[index]?.endpointPort}
                      />
                      {submitAttempted && errors.peers[index]?.endpointPort ? (
                        <FormError>{errors.peers[index]?.endpointPort}</FormError>
                      ) : null}
                    </Label>
                  </FieldRow>
                  <FieldRow>
                    <Label>
                      <span>Allowed addresses</span>
                      <Input
                        value={draft.peers[index].allowedAddresses}
                        onChange={(e) => setPeerField(index, 'allowedAddresses', e.target.value)}
                        placeholder="0.0.0.0/0"
                        autoComplete="off"
                        aria-label="Allowed addresses"
                      />
                    </Label>
                    <Label>
                      <span>Persistent keepalive (s)</span>
                      <Input
                        value={draft.peers[index].persistentKeepalive}
                        onChange={(e) => setPeerField(index, 'persistentKeepalive', e.target.value)}
                        placeholder="empty = off"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label="Persistent keepalive"
                        aria-invalid={submitAttempted && !!errors.peers[index]?.persistentKeepalive}
                      />
                      {submitAttempted && errors.peers[index]?.persistentKeepalive ? (
                        <FormError>{errors.peers[index]?.persistentKeepalive}</FormError>
                      ) : null}
                    </Label>
                  </FieldRow>
                  <FieldRow>
                    <Label>
                      <span>Peer public key (replace)</span>
                      <Input
                        value={draft.peers[index].peerPublicKey}
                        onChange={(e) => setPeerField(index, 'peerPublicKey', e.target.value)}
                        placeholder="leave empty to keep current"
                        autoComplete="off"
                        aria-label="Peer public key"
                      />
                    </Label>
                    <Label>
                      <span>Preshared key (replace)</span>
                      <PasswordInput
                        value={draft.peers[index].preSharedKey}
                        onChange={(e) => setPeerField(index, 'preSharedKey', e.target.value)}
                        placeholder="leave empty to keep current"
                        aria-label="Preshared key"
                        autoComplete="new-password"
                      />
                    </Label>
                  </FieldRow>
                </Fragment>
              ))
            ) : (
              <p style={{ color: 'var(--color-muted)' }}>This WireGuard client has no peers.</p>
            )}
            {error ? <FormError role="alert">{error}</FormError> : null}
          </FieldStack>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={!!pendingDeletePeer}
        title="Delete WireGuard peer"
        description={
          pendingDeletePeer
            ? `Remove peer "${pendingDeletePeer.name}" from this client? This cannot be undone.`
            : undefined
        }
        confirmLabel={peerDeleteSubmitting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDeletePeer}
        onCancel={() => (peerDeleteSubmitting ? undefined : setPendingDeletePeer(null))}
      />
    </>
  );
}
