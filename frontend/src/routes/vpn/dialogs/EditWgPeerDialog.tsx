import { useMemo, useState } from 'react';
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
  const { t } = useTranslation('vpn');
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

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const errors = useMemo(
    () => ({
      endpointPort:
        draft.endpointPort.trim() === '' || isPort(draft.endpointPort)
          ? null
          : t('shared.portRange'),
      persistentKeepalive:
        draft.persistentKeepalive.trim() === '' ||
        (Number.isInteger(Number(draft.persistentKeepalive)) &&
          Number(draft.persistentKeepalive) > 0)
          ? null
          : t('shared.keepalivePositive'),
    }),
    [draft.endpointPort, draft.persistentKeepalive, t],
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
            : t('wgPeerEdit.updateFailed');
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
      title={t('wgPeerEdit.title', { name: peer.name })}
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
      <FieldStack>
        <FieldRow>
          <Label>
            <span>{t('shared.name')}</span>
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="off"
              aria-label={t('shared.name')}
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{t('shared.endpointAddress')}</span>
            <Input
              value={draft.endpointAddress}
              onChange={(e) => set('endpointAddress', e.target.value)}
              autoComplete="off"
              aria-label={t('shared.endpointAddress')}
              dir="ltr"
            />
          </Label>
          <Label>
            <span>{t('clients.form.endpointPort')}</span>
            <Input
              value={draft.endpointPort}
              onChange={(e) => set('endpointPort', e.target.value)}
              onBlur={() => markTouched('endpointPort')}
              inputMode="numeric"
              autoComplete="off"
              aria-label={t('clients.form.endpointPort')}
              dir="ltr"
              aria-invalid={touched.endpointPort && !!errors.endpointPort}
            />
            {touched.endpointPort && errors.endpointPort ? (
              <FormError>{errors.endpointPort}</FormError>
            ) : null}
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{t('shared.allowedAddresses')}</span>
            <Input
              value={draft.allowedAddresses}
              onChange={(e) => set('allowedAddresses', e.target.value)}
              autoComplete="off"
              aria-label={t('shared.allowedAddresses')}
              dir="ltr"
            />
          </Label>
          <Label>
            <span>{t('shared.keepaliveSeconds')}</span>
            <Input
              value={draft.persistentKeepalive}
              onChange={(e) => set('persistentKeepalive', e.target.value)}
              onBlur={() => markTouched('persistentKeepalive')}
              placeholder={t('shared.keepalivePlaceholder')}
              inputMode="numeric"
              autoComplete="off"
              aria-label={t('shared.keepalive')}
              aria-invalid={touched.persistentKeepalive && !!errors.persistentKeepalive}
            />
            {touched.persistentKeepalive && errors.persistentKeepalive ? (
              <FormError>{errors.persistentKeepalive}</FormError>
            ) : null}
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{t('shared.presharedKey')}</span>
            <PasswordInput
              value={draft.preSharedKey}
              onChange={(e) => set('preSharedKey', e.target.value)}
              aria-label={t('shared.presharedKey')}
              dir="ltr"
              autoComplete="new-password"
            />
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
    </Dialog>
  );
}
