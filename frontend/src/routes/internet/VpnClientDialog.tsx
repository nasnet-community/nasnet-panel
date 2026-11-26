import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldStack, FormError, RadioGroup, Switch } from '@nasnet/ui';
import type { RoutingNode } from '@nasnet/mocks';
import { nodeLabel } from './layout';

type Role = Exclude<NonNullable<RoutingNode['failoverRole']>, 'standby'>;

const ROLES: readonly Role[] = ['primary', 'backup1', 'backup2'];

export interface VpnClientChange {
  name: string;
  enabled: boolean;
  role?: Role;
}

export interface VpnClientDialogProps {
  node: RoutingNode;
  onClose: () => void;
  onSave: (change: VpnClientChange) => Promise<void>;
}

export function VpnClientDialog({ node, onClose, onSave }: VpnClientDialogProps) {
  const { t } = useTranslation('internet');
  const { t: tVpn } = useTranslation('vpn');
  const [enabled, setEnabled] = useState(node.enabled ?? true);
  const [role, setRole] = useState<Role | null>(
    node.failoverRole && node.failoverRole !== 'standby' ? node.failoverRole : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = node.id.replace(/^vpn_/, '');
  const enabledChanged = enabled !== (node.enabled ?? true);
  const roleChanged = enabled && role !== null && role !== node.failoverRole;
  const canSave = !saving && (enabledChanged || roleChanged);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, enabled, role: roleChanged ? (role ?? undefined) : undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('internet.updateFailedFallback'));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? () => undefined : onClose}
      title={t('internet.vpnDialog.title', { name: nodeLabel(node) })}
      description={t('internet.vpnDialog.description')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('internet.vpnDialog.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? t('internet.vpnDialog.saving') : t('internet.vpnDialog.save')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <Switch
          id="vpn-enabled"
          label={t('internet.vpnDialog.enabled')}
          checked={enabled}
          disabled={saving}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <RadioGroup
          name="internet-failover-role"
          ariaLabel={t('internet.vpnDialog.role')}
          value={role ?? ''}
          options={ROLES.map((value) => ({
            value,
            label: tVpn(`clients.table.role.${value}`),
            description: tVpn(`clients.roleDialog.hint.${value}`),
          }))}
          onChange={(next) => {
            if (!saving && enabled) setRole(next as Role);
          }}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
