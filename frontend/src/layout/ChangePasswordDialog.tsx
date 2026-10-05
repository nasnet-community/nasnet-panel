import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, PasswordInput, Stack, useToast } from '@nasnet/ui';
import { ApiError, changeUserPassword } from '../api';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import styles from './ChangePasswordDialog.module.scss';

export interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const toast = useToast();
  const { t } = useTranslation('layout');
  const { activeRouterId, getCredentials, setCredentials } = useSession();
  const router = useRouter(activeRouterId ?? undefined);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    if (!activeRouterId || !router?.host) {
      setError(t('changePassword.errors.noRouter'));
      return;
    }
    const creds = getCredentials(activeRouterId);
    if (!creds) {
      setError(t('changePassword.errors.sessionExpired'));
      return;
    }
    if (newPassword.length < 1) {
      setError(t('changePassword.errors.empty'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.errors.mismatch'));
      return;
    }
    if (newPassword === creds.password) {
      setError(t('changePassword.errors.sameAsCurrent'));
      return;
    }

    setSaving(true);
    try {
      await changeUserPassword({ host: router.host, ...creds }, newPassword);
      setCredentials(activeRouterId, { ...creds, password: newPassword });
      toast.notify({ title: t('changePassword.toastSuccess'), tone: 'success' });
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('changePassword.errors.failed');
      setError(message);
      toast.notify({
        title: t('changePassword.toastFailed'),
        description: message,
        tone: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={t('changePassword.title')}
      description={
        router?.name
          ? t('changePassword.descriptionNamed', { name: router.name })
          : t('changePassword.description')
      }
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('changePassword.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? t('changePassword.saving') : t('changePassword.submit')}
          </Button>
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="change-password-new">
            {t('changePassword.newPassword')}
          </label>
          <PasswordInput
            id="change-password-new"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={saving}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="change-password-confirm">
            {t('changePassword.confirmPassword')}
          </label>
          <PasswordInput
            id="change-password-confirm"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={saving}
          />
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <p className={styles.hint}>{t('changePassword.hint')}</p>
        )}
      </Stack>
    </Dialog>
  );
}
