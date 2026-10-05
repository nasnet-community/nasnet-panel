import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, TriangleAlert } from 'lucide-react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
  Select,
  Switch,
} from '@nasnet/ui';
import {
  ApiError,
  createVPNUser,
  isAbortError,
  listVPNProfiles,
  updateVPNUser,
  type UpdateVPNUserRequest,
  type VPNCredentials,
  type VPNProfileResponse,
  type VPNUserResponse,
} from '../../../api';
import { validateOvpnSecret } from '../../../utils/validators';
import styles from './UserFormDialog.module.scss';

const PREFERRED_PROFILE = 'VPN-VPN';

// `textKey` is translated at render so the hint follows the active language.
const PROFILE_HINTS: Record<
  string,
  {
    tone: 'info' | 'danger';
    textKey:
      'users.form.hints.vpnVpn' | 'users.form.hints.vpnSplit' | 'users.form.hints.vpnForeign';
  }
> = {
  'VPN-VPN': { tone: 'info', textKey: 'users.form.hints.vpnVpn' },
  'VPN-Split': { tone: 'info', textKey: 'users.form.hints.vpnSplit' },
  'VPN-Foreign': { tone: 'danger', textKey: 'users.form.hints.vpnForeign' },
};

interface Draft {
  name: string;
  password: string;
  profile: string;
  disabled: boolean;
}

interface Props {
  creds: VPNCredentials | null;
  user: VPNUserResponse | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function UserFormDialog({ creds, user, onCancel, onSaved }: Props) {
  const { t } = useTranslation('vpn');
  const isEdit = !!user;
  const [profiles, setProfiles] = useState<VPNProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: user?.name ?? '',
    password: '',
    profile: user?.profile ?? '',
    disabled: user?.disabled ?? false,
  });
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
        const data = await listVPNProfiles(creds, controller.signal);
        const selectable = data.filter((p) => !p.default);
        setProfiles(selectable);
        setDraft((d) => {
          if (d.profile) return d;
          const preferred = selectable.find((p) => p.name === PREFERRED_PROFILE);
          const fallback = preferred ?? selectable[0];
          return fallback ? { ...d, profile: fallback.name } : d;
        });
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('users.form.loadProfilesFailed');
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds, t]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const profileOptions = useMemo(() => {
    const options = profiles.map((p) => ({ value: p.name, label: p.name, description: p.comment }));
    if (user?.profile && !profiles.some((p) => p.name === user.profile)) {
      options.unshift({ value: user.profile, label: user.profile, description: undefined });
    }
    return options;
  }, [profiles, user?.profile]);

  const profileHint = PROFILE_HINTS[draft.profile];

  const errors = useMemo(
    () => ({
      name: draft.name.trim() === '' ? t('shared.nameRequired') : null,
      password: isEdit && draft.password === '' ? null : validateOvpnSecret(draft.password),
      profile: draft.profile === '' ? t('users.form.profileRequired') : null,
    }),
    [draft, isEdit, t],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!creds && !submitting && !loading && !loadError && !hasErrors;

  const handleSubmit = async () => {
    if (!creds) return;
    setTouched({ name: true, password: true, profile: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    try {
      if (user) {
        const body: UpdateVPNUserRequest = {};
        const name = draft.name.trim();
        if (name !== user.name) body.name = name;
        if (draft.password !== '') body.password = draft.password;
        if (draft.profile !== user.profile) body.profile = draft.profile;
        if (draft.disabled !== user.disabled) body.disabled = draft.disabled;
        if (Object.keys(body).length > 0) {
          await updateVPNUser(creds, user.id, body);
        }
      } else {
        await createVPNUser(creds, {
          name: draft.name.trim(),
          password: draft.password,
          profile: draft.profile,
          disabled: draft.disabled,
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : user
              ? t('users.form.updateFailed')
              : t('users.form.createFailed');
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
      title={user ? t('users.form.editTitle', { name: user.name }) : t('users.form.newTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('shared.cancel')}
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting
              ? t('shared.saving')
              : user
                ? t('shared.saveChanges')
                : t('users.form.create')}
          </Button>
        </>
      }
    >
      {loading ? (
        <p>{t('shared.loading')}</p>
      ) : loadError ? (
        <FormError role="alert">{loadError}</FormError>
      ) : (
        <FieldStack>
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <Info size={16} aria-hidden className={styles.alertIcon} />
            <span>{t('users.form.scopeNote')}</span>
          </div>
          {profileHint ? (
            <div
              className={`${styles.alert} ${
                profileHint.tone === 'danger' ? styles.alertDanger : styles.alertInfo
              }`}
              role={profileHint.tone === 'danger' ? 'alert' : undefined}
            >
              {profileHint.tone === 'danger' ? (
                <TriangleAlert size={16} aria-hidden className={styles.alertIcon} />
              ) : (
                <Info size={16} aria-hidden className={styles.alertIcon} />
              )}
              <span>
                <strong>{draft.profile}</strong> {t(profileHint.textKey)}
              </span>
            </div>
          ) : null}
          <FieldRow>
            <Label>
              <span>{t('shared.name')}</span>
              <Input
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => markTouched('name')}
                autoComplete="off"
                aria-label={t('shared.name')}
                aria-invalid={touched.name && !!errors.name}
              />
              {touched.name && errors.name ? <FormError>{errors.name}</FormError> : null}
            </Label>
            <Label>
              <span>{t('shared.password')}</span>
              <PasswordInput
                value={draft.password}
                onChange={(e) => set('password', e.target.value)}
                onBlur={() => markTouched('password')}
                aria-label={t('shared.password')}
                aria-invalid={touched.password && !!errors.password}
                autoComplete="new-password"
                placeholder={isEdit ? t('users.form.passwordKeep') : undefined}
              />
              {touched.password && errors.password ? (
                <FormError>{errors.password}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>{t('users.table.profile')}</span>
              <Select
                aria-label={t('users.table.profile')}
                value={draft.profile}
                onChange={(v) => set('profile', v)}
                options={profileOptions}
                placeholder={
                  profileOptions.length ? t('users.form.selectProfile') : t('users.form.noProfiles')
                }
              />
              {touched.profile && errors.profile ? <FormError>{errors.profile}</FormError> : null}
            </Label>
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
      )}
    </Dialog>
  );
}
