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
  fetchL2TPClientDetails,
  isAbortError,
  type L2TPClientDetailsResponse,
  type UpdateL2TPClientRequest,
  type VPNCredentials,
} from '../../../api';
import { validateHostOrIp } from '../../../utils/validators';

interface Draft {
  connectTo: string;
  user: string;
  password: string;
  useIpsec: boolean;
  ipsecSecret: string;
  disabled: boolean;
}

interface Props {
  clientName: string;
  creds: VPNCredentials | null;
  onCancel: () => void;
  onSubmit: (req: UpdateL2TPClientRequest) => Promise<void>;
}

export function EditL2tpClientDialog({ clientName, creds, onCancel, onSubmit }: Props) {
  const [details, setDetails] = useState<L2TPClientDetailsResponse | null>(null);
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
    setLoadError(null);
    setLoading(true);

    (async () => {
      try {
        const data = await fetchL2TPClientDetails(creds, clientName, controller.signal);
        setDetails(data);
        setDraft({
          connectTo: data.connectTo,
          user: data.user,
          password: '',
          useIpsec: data.useIPsec,
          ipsecSecret: '',
          disabled: data.disabled,
        });
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load L2TP client.';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, clientName]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(() => {
    if (!draft) return { connectTo: null, user: null };
    return {
      connectTo: draft.connectTo.trim() === '' ? 'Required.' : validateHostOrIp(draft.connectTo),
      user: draft.user.trim() === '' ? 'User is required.' : null,
    };
  }, [draft]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!draft && !!details && !submitting && !hasErrors;

  const handleSubmit = async () => {
    if (!draft || !details) return;
    setTouched({ connectTo: true, user: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const body: UpdateL2TPClientRequest = {};
    if (draft.connectTo.trim() !== details.connectTo) body.connectTo = draft.connectTo.trim();
    if (draft.user.trim() !== details.user) body.user = draft.user.trim();
    if (draft.password !== '') body.password = draft.password;
    if (draft.disabled !== details.disabled) body.disabled = draft.disabled;
    if (!draft.useIpsec && details.useIPsec) {
      body.ipsecSecret = '';
    } else if (draft.useIpsec && draft.ipsecSecret !== '') {
      body.ipsecSecret = draft.ipsecSecret;
    }

    try {
      await onSubmit(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update L2TP client.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={`Edit L2TP client - ${clientName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
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
              <Input value={clientName} disabled aria-label="Name" />
            </Label>
            <Label>
              <span>Connect to</span>
              <Input
                value={draft.connectTo}
                onChange={(e) => set('connectTo', e.target.value)}
                onBlur={() => markTouched('connectTo')}
                placeholder="192.168.1.1"
                aria-label="Connect to"
                aria-invalid={touched.connectTo && !!errors.connectTo}
              />
              {touched.connectTo && errors.connectTo ? (
                <FormError>{errors.connectTo}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>User</span>
              <Input
                value={draft.user}
                onChange={(e) => set('user', e.target.value)}
                onBlur={() => markTouched('user')}
                placeholder="username"
                aria-label="User"
                autoComplete="off"
                aria-invalid={touched.user && !!errors.user}
              />
              {touched.user && errors.user ? <FormError>{errors.user}</FormError> : null}
            </Label>
            <Label>
              <span>Password</span>
              <PasswordInput
                value={draft.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Leave blank to keep current"
                aria-label="Password"
                autoComplete="new-password"
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>IPsec secret</span>
              <PasswordInput
                value={draft.ipsecSecret}
                onChange={(e) => set('ipsecSecret', e.target.value)}
                placeholder={draft.useIpsec ? 'Leave blank to keep current' : 'Pre-shared key'}
                aria-label="IPsec secret"
                autoComplete="off"
                disabled={!draft.useIpsec}
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
            <Label as="div">
              <Switch
                label="Use IPsec"
                checked={draft.useIpsec}
                onChange={(e) => {
                  const on = e.target.checked;
                  setDraft((d) =>
                    d ? { ...d, useIpsec: on, ipsecSecret: on ? d.ipsecSecret : '' } : d,
                  );
                }}
              />
            </Label>
          </FieldRow>
          {error ? <FormError role="alert">{error}</FormError> : null}
        </FieldStack>
      ) : null}
    </Dialog>
  );
}
