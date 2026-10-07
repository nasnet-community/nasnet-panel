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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('vpn');

  useEffect(() => {
    if (!creds) {
      setLoading(false);
      setLoadError(t('shared.notConnectedDot'));
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
              : t('wgClientEdit.loadFailed');
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, client.name, t]);

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
        draft.listenPort.trim() === '' || isPort(draft.listenPort) ? null : t('shared.portRange'),
      mtu:
        draft.mtu.trim() === '' || (Number.isInteger(Number(draft.mtu)) && Number(draft.mtu) > 0)
          ? null
          : t('shared.mtuPositive'),
      peers: draft.peers.map((p) => ({
        endpointPort:
          p.endpointPort.trim() === '' || isPort(p.endpointPort) ? null : t('shared.portRange'),
        persistentKeepalive:
          p.persistentKeepalive.trim() === '' ||
          (Number.isInteger(Number(p.persistentKeepalive)) && Number(p.persistentKeepalive) > 0)
            ? null
            : t('shared.keepalivePositive'),
      })),
    };
  }, [draft, t]);

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
            : t('wgClientEdit.updateFailed');
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
            : t('details.peers.deleteFailedDescription');
      toast.notify({
        title: t('details.peers.deleteFailed'),
        description: message,
        tone: 'danger',
      });
      setPeerDeleteSubmitting(false);
      return;
    }
    const index = peers.indexOf(target);
    setPeers((prev) => prev.filter((p) => p !== target));
    setDraft((d) => (d ? { ...d, peers: d.peers.filter((_, i) => i !== index) } : d));
    setPeerDeleteSubmitting(false);
    setPendingDeletePeer(null);
    toast.notify({ title: t('details.peers.deleted', { name: target.name }), tone: 'info' });
  };

  return (
    <>
      <Dialog
        open
        onClose={submitting ? () => undefined : onCancel}
        title={t('wgClientEdit.title', { name: client.name })}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={onCancel} disabled={submitting}>
              {t('shared.cancel')}
            </Button>
            <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? t('shared.saving') : t('shared.saveChanges')}
            </Button>
          </>
        }
      >
        {loading ? (
          <p>{t('shared.loading')}</p>
        ) : loadError ? (
          <FormError role="alert">{loadError}</FormError>
        ) : draft ? (
          <FieldStack>
            <FieldRow>
              <Label>
                <span>{t('shared.name')}</span>
                <Input
                  value={draft.comment}
                  onChange={(e) => set('comment', e.target.value)}
                  placeholder={t('shared.optional')}
                  autoComplete="off"
                  aria-label={t('shared.name')}
                />
              </Label>
              <Label>
                <span>{t('shared.listenPort')}</span>
                <Input
                  value={draft.listenPort}
                  onChange={(e) => set('listenPort', e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={t('shared.listenPort')}
                  dir="ltr"
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
                  placeholder={t('shared.leaveEmpty')}
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
                <span>{t('wgClientEdit.interfacePrivateKeyReplace')}</span>
                <PasswordInput
                  value={draft.interfacePrivateKey}
                  onChange={(e) => set('interfacePrivateKey', e.target.value)}
                  placeholder={t('shared.leaveEmpty')}
                  aria-label={t('addClient.interfacePrivateKey')}
                  dir="ltr"
                  autoComplete="new-password"
                />
              </Label>
            </FieldRow>
            <FieldRow>
              <Label as="div">
                <Switch
                  label={t('shared.enabled')}
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
                    <strong>{t('wgClientEdit.peerHeading', { name: peer.name })}</strong>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={submitting || peers.length <= 1}
                      title={
                        peers.length <= 1
                          ? t('wgClientEdit.needsOnePeer')
                          : t('shared.deleteNamed', { name: peer.name })
                      }
                      aria-label={t('details.peers.deletePeer', { name: peer.name })}
                      onClick={() => setPendingDeletePeer(peer)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  </div>
                  <FieldRow>
                    <Label>
                      <span>{t('shared.endpointAddress')}</span>
                      <Input
                        value={draft.peers[index].endpointAddress}
                        onChange={(e) => setPeerField(index, 'endpointAddress', e.target.value)}
                        autoComplete="off"
                        aria-label={t('shared.endpointAddress')}
                        dir="ltr"
                      />
                    </Label>
                    <Label>
                      <span>{t('clients.form.endpointPort')}</span>
                      <Input
                        value={draft.peers[index].endpointPort}
                        onChange={(e) => setPeerField(index, 'endpointPort', e.target.value)}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={t('clients.form.endpointPort')}
                        dir="ltr"
                        aria-invalid={submitAttempted && !!errors.peers[index]?.endpointPort}
                      />
                      {submitAttempted && errors.peers[index]?.endpointPort ? (
                        <FormError>{errors.peers[index]?.endpointPort}</FormError>
                      ) : null}
                    </Label>
                  </FieldRow>
                  <FieldRow>
                    <Label>
                      <span>{t('shared.allowedAddresses')}</span>
                      <Input
                        value={draft.peers[index].allowedAddresses}
                        onChange={(e) => setPeerField(index, 'allowedAddresses', e.target.value)}
                        placeholder="0.0.0.0/0"
                        autoComplete="off"
                        aria-label={t('shared.allowedAddresses')}
                        dir="ltr"
                      />
                    </Label>
                    <Label>
                      <span>{t('shared.keepaliveSeconds')}</span>
                      <Input
                        value={draft.peers[index].persistentKeepalive}
                        onChange={(e) => setPeerField(index, 'persistentKeepalive', e.target.value)}
                        placeholder={t('shared.keepalivePlaceholder')}
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={t('shared.keepalive')}
                        aria-invalid={submitAttempted && !!errors.peers[index]?.persistentKeepalive}
                      />
                      {submitAttempted && errors.peers[index]?.persistentKeepalive ? (
                        <FormError>{errors.peers[index]?.persistentKeepalive}</FormError>
                      ) : null}
                    </Label>
                  </FieldRow>
                  <FieldRow>
                    <Label>
                      <span>{t('wgClientEdit.peerPublicKeyReplace')}</span>
                      <Input
                        value={draft.peers[index].peerPublicKey}
                        onChange={(e) => setPeerField(index, 'peerPublicKey', e.target.value)}
                        placeholder={t('shared.leaveEmpty')}
                        autoComplete="off"
                        aria-label={t('shared.peerPublicKey')}
                        dir="ltr"
                      />
                    </Label>
                    <Label>
                      <span>{t('wgClientEdit.presharedKeyReplace')}</span>
                      <PasswordInput
                        value={draft.peers[index].preSharedKey}
                        onChange={(e) => setPeerField(index, 'preSharedKey', e.target.value)}
                        placeholder={t('shared.leaveEmpty')}
                        aria-label={t('shared.presharedKey')}
                        dir="ltr"
                        autoComplete="new-password"
                      />
                    </Label>
                  </FieldRow>
                </Fragment>
              ))
            ) : (
              <p style={{ color: 'var(--color-muted)' }}>{t('wgClientEdit.noPeers')}</p>
            )}
            {error ? <FormError role="alert">{error}</FormError> : null}
          </FieldStack>
        ) : null}
      </Dialog>
      <ConfirmDialog
        open={!!pendingDeletePeer}
        title={t('details.peers.deleteTitle')}
        description={
          pendingDeletePeer
            ? t('wgClientEdit.deletePeerDescription', { name: pendingDeletePeer.name })
            : undefined
        }
        confirmLabel={peerDeleteSubmitting ? t('shared.deleting') : t('shared.delete')}
        destructive
        onConfirm={onConfirmDeletePeer}
        onCancel={() => (peerDeleteSubmitting ? undefined : setPendingDeletePeer(null))}
      />
    </>
  );
}
