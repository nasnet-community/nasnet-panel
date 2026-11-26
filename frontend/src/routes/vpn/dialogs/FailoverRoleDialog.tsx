import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldStack, FormError, RadioGroup } from '@nasnet/ui';
import { ApiError, updateVPNClient, type VPNClient, type VPNCredentials } from '../../../api';

type Role = Exclude<NonNullable<VPNClient['failoverRole']>, 'standby'>;

const ROLES: readonly Role[] = ['primary', 'backup1', 'backup2'];

interface Props {
  creds: VPNCredentials | null;
  client: VPNClient;
  onClose: () => void;
  onSaved: (role: Role) => void;
}

export function FailoverRoleDialog({ creds, client, onClose, onSaved }: Props) {
  const { t } = useTranslation('vpn');
  const [role, setRole] = useState<Role | null>(
    client.failoverRole && client.failoverRole !== 'standby' ? client.failoverRole : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!creds && !submitting && role !== null && role !== client.failoverRole;

  const submit = async () => {
    if (!creds || !role) return;
    setError(null);
    setSubmitting(true);
    try {
      await updateVPNClient(creds, client.name, { failoverRole: role });
      onSaved(role);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : t('clients.toast.roleFailedDescription'),
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onClose}
      title={t('clients.roleDialog.title', { name: client.comment || client.name })}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('shared.cancel')}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {t('clients.roleDialog.save')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <p style={{ margin: 0 }}>{t('clients.roleDialog.description')}</p>
        <RadioGroup
          name="failover-role"
          ariaLabel={t('clients.table.failoverRole')}
          value={role ?? ''}
          options={ROLES.map((value) => ({
            value,
            label: t(`clients.table.role.${value}`),
            description: t(`clients.roleDialog.hint.${value}`),
          }))}
          onChange={(next) => {
            if (!submitting) setRole(next as Role);
          }}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
