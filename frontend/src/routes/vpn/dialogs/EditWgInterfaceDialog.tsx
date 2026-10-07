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
  const { t } = useTranslation('vpn');
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
      setLoadError(t('shared.notConnectedDot'));
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
              : t('wgInterface.loadFailed');
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, server.name, t]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const errors = useMemo(() => {
    if (!draft) return { listenPort: null, mtu: null };
    return {
      listenPort:
        draft.listenPort.trim() === '' || isPort(draft.listenPort) ? null : t('shared.portRange'),
      mtu:
        draft.mtu.trim() === '' || (Number.isInteger(Number(draft.mtu)) && Number(draft.mtu) > 0)
          ? null
          : t('shared.mtuPositive'),
    };
  }, [draft, t]);

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
            : t('wgInterface.updateFailed');
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
      title={t('wgInterface.title', { name: server.name })}
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
              <Input value={server.name} disabled aria-label={t('shared.name')} />
            </Label>
            <Label>
              <span>{t('shared.listenPort')}</span>
              <Input
                value={draft.listenPort}
                onChange={(e) => set('listenPort', e.target.value)}
                onBlur={() => markTouched('listenPort')}
                inputMode="numeric"
                autoComplete="off"
                aria-label={t('shared.listenPort')}
                dir="ltr"
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
                placeholder={t('shared.leaveEmpty')}
                inputMode="numeric"
                autoComplete="off"
                aria-label="MTU"
                aria-invalid={touched.mtu && !!errors.mtu}
              />
              {touched.mtu && errors.mtu ? <FormError>{errors.mtu}</FormError> : null}
            </Label>
            <Label>
              <span>{t('shared.comment')}</span>
              <Input
                value={draft.comment}
                onChange={(e) => set('comment', e.target.value)}
                placeholder={t('shared.leaveEmpty')}
                autoComplete="off"
                aria-label={t('shared.comment')}
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>{t('wgInterface.privateKeyReplace')}</span>
              <PasswordInput
                value={draft.privateKey}
                onChange={(e) => set('privateKey', e.target.value)}
                placeholder={t('shared.leaveEmpty')}
                aria-label={t('shared.privateKey')}
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
          {error ? <FormError role="alert">{error}</FormError> : null}
        </FieldStack>
      ) : null}
    </Dialog>
  );
}
