import { useEffect, useState } from 'react';
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
      setError('No active router. Open a router first.');
      return;
    }
    const creds = getCredentials(activeRouterId);
    if (!creds) {
      setError('Session expired. Please reconnect to the router.');
      return;
    }
    if (newPassword.length < 1) {
      setError('Enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword === creds.password) {
      setError('New password must be different from the current one.');
      return;
    }

    setSaving(true);
    try {
      await changeUserPassword({ host: router.host, ...creds }, newPassword);
      setCredentials(activeRouterId, { ...creds, password: newPassword });
      toast.notify({ title: 'Password changed', tone: 'success' });
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to change password.';
      setError(message);
      toast.notify({ title: 'Failed to change password', description: message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="Change password"
      description={
        router?.name
          ? `Update the password for "${router.name}".`
          : 'Update the router login password.'
      }
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Change password'}
          </Button>
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.field}>
          <label className={styles.label} htmlFor="change-password-new">
            New password
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
            Confirm new password
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
          <p className={styles.hint}>
            You will stay signed in — the new password is saved for this session.
          </p>
        )}
      </Stack>
    </Dialog>
  );
}
