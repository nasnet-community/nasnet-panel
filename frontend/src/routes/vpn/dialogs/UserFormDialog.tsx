import { useEffect, useMemo, useState } from 'react';
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

const PROFILE_HINTS: Record<string, { tone: 'info' | 'danger'; text: string }> = {
  'VPN-VPN': {
    tone: 'info',
    text: 'All of the user’s traffic is routed through the outbound VPN.',
  },
  'VPN-Split': {
    tone: 'info',
    text: 'Foreign traffic is routed through the outbound VPN and domestic traffic through the domestic link.',
  },
  'VPN-Foreign': {
    tone: 'danger',
    text: 'All of the user’s traffic is routed through Starlink, which can expose your identity and Starlink usage. Use with caution.',
  },
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
  const [profiles, setProfiles] = useState<VPNProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: user?.name ?? '',
    password: user?.password ?? '',
    profile: user?.profile ?? '',
    disabled: user?.disabled ?? false,
  });
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
              : 'Failed to load VPN profiles.';
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [creds]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

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
      name: draft.name.trim() === '' ? 'Name is required.' : null,
      password: validateOvpnSecret(draft.password),
      profile: draft.profile === '' ? 'Profile is required.' : null,
    }),
    [draft],
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
        if (draft.password !== user.password) body.password = draft.password;
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
              ? 'Failed to update VPN user.'
              : 'Failed to create VPN user.';
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
      title={user ? `Edit VPN user - ${user.name}` : 'New VPN user'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving…' : user ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      {loading ? (
        <p>Loading…</p>
      ) : loadError ? (
        <FormError role="alert">{loadError}</FormError>
      ) : (
        <FieldStack>
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <Info size={16} aria-hidden className={styles.alertIcon} />
            <span>
              VPN users apply to OpenVPN, L2TP and SSTP. For WireGuard, open the WireGuard server
              and add a peer instead.
            </span>
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
                <strong>{draft.profile}</strong> {profileHint.text}
              </span>
            </div>
          ) : null}
          <FieldRow>
            <Label>
              <span>Name</span>
              <Input
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => markTouched('name')}
                autoComplete="off"
                aria-label="Name"
                aria-invalid={touched.name && !!errors.name}
              />
              {touched.name && errors.name ? <FormError>{errors.name}</FormError> : null}
            </Label>
            <Label>
              <span>Password</span>
              <PasswordInput
                value={draft.password}
                onChange={(e) => set('password', e.target.value)}
                onBlur={() => markTouched('password')}
                aria-label="Password"
                aria-invalid={touched.password && !!errors.password}
                autoComplete="new-password"
              />
              {touched.password && errors.password ? (
                <FormError>{errors.password}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>Profile</span>
              <Select
                aria-label="Profile"
                value={draft.profile}
                onChange={(v) => set('profile', v)}
                options={profileOptions}
                placeholder={profileOptions.length ? 'Select a profile' : 'No profiles available'}
              />
              {touched.profile && errors.profile ? <FormError>{errors.profile}</FormError> : null}
            </Label>
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
      )}
    </Dialog>
  );
}
