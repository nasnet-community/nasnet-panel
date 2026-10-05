import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  comment: string;
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
  const { t } = useTranslation('vpn');
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
      setLoadError(t('shared.notConnectedDot'));
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
          comment: data.comment || clientName,
          connectTo: data.connectTo,
          user: data.user,
          password: data.password,
          useIpsec: data.useIPsec,
          ipsecSecret: data.useIPsec ? data.ipsecSecret : '',
          disabled: data.disabled,
        });
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('l2tpEdit.loadFailed');
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, clientName, t]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const errors = useMemo(() => {
    if (!draft) return { connectTo: null, user: null };
    return {
      connectTo:
        draft.connectTo.trim() === '' ? t('shared.required') : validateHostOrIp(draft.connectTo),
      user: draft.user.trim() === '' ? t('l2tpEdit.userRequired') : null,
    };
  }, [draft, t]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!draft && !!details && !submitting && !hasErrors;

  const handleSubmit = async () => {
    if (!draft || !details) return;
    setTouched({ connectTo: true, user: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    const body: UpdateL2TPClientRequest = {};
    const comment = draft.comment.trim();
    if (comment !== (details.comment || clientName).trim()) body.comment = comment;
    if (draft.connectTo.trim() !== details.connectTo) body.connectTo = draft.connectTo.trim();
    if (draft.user.trim() !== details.user) body.user = draft.user.trim();
    if (draft.password !== details.password) body.password = draft.password;
    if (draft.disabled !== details.disabled) body.disabled = draft.disabled;
    if (!draft.useIpsec && details.useIPsec) {
      body.ipsecSecret = '';
    } else if (draft.useIpsec && draft.ipsecSecret !== details.ipsecSecret) {
      body.ipsecSecret = draft.ipsecSecret;
    }

    try {
      await onSubmit(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('clients.toast.l2tpUpdateFailedDescription'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={t('l2tpEdit.title', { name: clientName })}
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
                aria-label={t('shared.name')}
                autoComplete="off"
              />
            </Label>
            <Label>
              <span>{t('shared.connectTo')}</span>
              <Input
                value={draft.connectTo}
                onChange={(e) => set('connectTo', e.target.value)}
                onBlur={() => markTouched('connectTo')}
                placeholder="192.168.1.1"
                aria-label={t('shared.connectTo')}
                dir="ltr"
                aria-invalid={touched.connectTo && !!errors.connectTo}
              />
              {touched.connectTo && errors.connectTo ? (
                <FormError>{errors.connectTo}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>{t('shared.user')}</span>
              <Input
                value={draft.user}
                onChange={(e) => set('user', e.target.value)}
                onBlur={() => markTouched('user')}
                placeholder={t('shared.usernamePlaceholder')}
                aria-label={t('shared.user')}
                autoComplete="off"
                aria-invalid={touched.user && !!errors.user}
              />
              {touched.user && errors.user ? <FormError>{errors.user}</FormError> : null}
            </Label>
            <Label>
              <span>{t('shared.password')}</span>
              <PasswordInput
                value={draft.password}
                onChange={(e) => set('password', e.target.value)}
                aria-label={t('shared.password')}
                autoComplete="new-password"
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>{t('shared.ipsecSecret')}</span>
              <PasswordInput
                value={draft.ipsecSecret}
                onChange={(e) => set('ipsecSecret', e.target.value)}
                placeholder={t('shared.preSharedKeyPlaceholder')}
                aria-label={t('shared.ipsecSecret')}
                autoComplete="off"
                disabled={!draft.useIpsec}
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
            <Label as="div">
              <Switch
                label={t('shared.useIpsec')}
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
