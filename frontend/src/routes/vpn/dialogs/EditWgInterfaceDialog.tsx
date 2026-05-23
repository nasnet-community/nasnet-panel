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
  fetchWireguardServerDetails,
  isAbortError,
  updateWireguardInterface,
  type UpdateWireguardInterfaceRequest,
  type VPNCredentials,
  type VPNServer,
  type WireguardServerDetailsResponse,
} from '../../../api';
import { isPort } from '../../../utils/validators';

interface Draft {
  comment: string;
  mtu: string;
  listenPort: string;
  privateKey: string;
  disabled: boolean;
}

interface Props {
  creds: VPNCredentials | null;
  server: VPNServer;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditWgInterfaceDialog({ creds, server, onCancel, onSaved }: Props) {
  const [details, setDetails] = useState<WireguardServerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
        const data = await fetchWireguardServerDetails(creds, server.name, controller.signal);
        setDetails(data);
        setDraft({
          comment: '',
          mtu: '',
          listenPort: String(data.port ?? ''),
          privateKey: '',
          disabled: !data.enabled,
        });
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load WireGuard interface.';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, server.name]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(() => {
    if (!draft) return { listenPort: null, mtu: null };
    return {
      listenPort:
        draft.listenPort.trim() === '' || isPort(draft.listenPort) ? null : 'Port must be 1-65535.',
      mtu:
        draft.mtu.trim() === '' || (Number.isInteger(Number(draft.mtu)) && Number(draft.mtu) > 0)
          ? null
          : 'MTU must be a positive integer.',
    };
  }, [draft]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!draft && !!details && !!creds && !submitting && !hasErrors;

  const handleSubmit = async () => {
    if (!draft || !details || !creds) return;
    setTouched({ listenPort: true, mtu: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const body: UpdateWireguardInterfaceRequest = {};
    if (draft.disabled !== !details.enabled) body.disabled = draft.disabled;
    if (draft.comment !== '') body.comment = draft.comment;
    if (draft.mtu.trim() !== '') body.mtu = Number(draft.mtu);
    const portNum = draft.listenPort.trim() === '' ? null : Number(draft.listenPort);
    if (portNum !== null && portNum !== details.port) body.listenPort = portNum;
    if (draft.privateKey.trim() !== '') body.privateKey = draft.privateKey.trim();

    try {
      await updateWireguardInterface(creds, server.name, body);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update WireGuard interface.';
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
      title={`Edit WireGuard server - ${server.name}`}
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
              <Input value={server.name} disabled aria-label="Name" />
            </Label>
            <Label>
              <span>Listen port</span>
              <Input
                value={draft.listenPort}
                onChange={(e) => set('listenPort', e.target.value)}
                onBlur={() => markTouched('listenPort')}
                inputMode="numeric"
                aria-label="Listen port"
                aria-invalid={touched.listenPort && !!errors.listenPort}
              />
              {touched.listenPort && errors.listenPort ? (
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
                onBlur={() => markTouched('mtu')}
                placeholder="leave empty to keep current"
                inputMode="numeric"
                aria-label="MTU"
                aria-invalid={touched.mtu && !!errors.mtu}
              />
              {touched.mtu && errors.mtu ? <FormError>{errors.mtu}</FormError> : null}
            </Label>
            <Label>
              <span>Comment</span>
              <Input
                value={draft.comment}
                onChange={(e) => set('comment', e.target.value)}
                placeholder="leave empty to keep current"
                aria-label="Comment"
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>Private key (replace)</span>
              <PasswordInput
                value={draft.privateKey}
                onChange={(e) => set('privateKey', e.target.value)}
                placeholder="leave empty to keep current"
                aria-label="Private key"
                autoComplete="off"
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
      ) : null}
    </Dialog>
  );
}
