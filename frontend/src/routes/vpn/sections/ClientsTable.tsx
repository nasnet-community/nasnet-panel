import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable, Switch, leadingNumber, useToast } from '@nasnet/ui';
import { AlertTriangle, ArrowDown, ArrowUp, Cable, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { ApiError, updateVPNClient, type VPNClient, type VPNCredentials } from '../../../api';
import { FailoverRoleDialog } from '../dialogs/FailoverRoleDialog';
import { useFormat } from '../../../utils/useFormat';
import { useThemeColors } from '../../../utils/theme-colors';
import styles from './ClientsTable.module.scss';

const ROLES = ['primary', 'backup1', 'backup2', 'standby'] as const;

const EDITABLE_PROTOCOLS = new Set<VPNClient['protocol']>(['l2tp', 'sstp', 'wireguard']);

interface Props {
  rows: VPNClient[];
  totalRows: number;
  creds: VPNCredentials | null;
  onToggled: () => void;
  onEdit: (client: VPNClient) => void;
  onDelete: (client: VPNClient) => void;
  onResetTraffic: (client: VPNClient) => void;
}

export function ClientsTable({
  rows,
  totalRows,
  creds,
  onToggled,
  onEdit,
  onDelete,
  onResetTraffic,
}: Props) {
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const format = useFormat();
  const colors = useThemeColors();
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [roleTarget, setRoleTarget] = useState<VPNClient | null>(null);

  const isPending = (id: string) => pending.has(id);
  const checkedFor = (c: VPNClient) => optimistic[c.id] ?? c.enabled;

  const setRowsPending = (ids: string[], on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const hasFallback = rows.some((c) => c.fallback);

  return (
    <>
      {hasFallback ? (
        <div className={styles.fallbackAlert} role="alert">
          <AlertTriangle size={20} className={styles.fallbackAlertIcon} aria-hidden />
          <div>
            <p className={styles.fallbackAlertTitle}>{t('clients.fallback.alertTitle')}</p>
            <p className={styles.fallbackAlertBody}>{t('clients.fallback.alertBody')}</p>
          </div>
        </div>
      ) : null}
      <DataTable
        columns={[
          {
            key: 'name',
            header: t('shared.name'),
            render: (c: VPNClient) => c.comment || c.name,
            sortValue: (c: VPNClient) => c.comment || c.name,
          },
          {
            key: 'status',
            header: t('shared.status'),
            render: (c: VPNClient) => (
              <span className={styles.statusCell}>
                <Badge tone={c.running ? 'success' : 'neutral'}>
                  {c.running ? t('shared.connected') : t('shared.disconnected')}
                </Badge>
                {c.fallback ? (
                  <span
                    className={styles.fallbackMark}
                    role="img"
                    title={t('clients.fallback.badge')}
                    aria-label={t('clients.fallback.badge')}
                  >
                    <span aria-hidden>!</span>
                  </span>
                ) : null}
              </span>
            ),
            sortValue: (c: VPNClient) => c.running,
          },
          {
            key: 'protocol',
            header: t('shared.protocol'),
            render: (c: VPNClient) => (
              <span
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-start',
                }}
              >
                <Badge tone="info">{c.protocol.toUpperCase()}</Badge>
                {c.protocol === 'wireguard' && c.peerCount !== undefined ? (
                  <Badge tone="neutral">
                    {t('clients.table.peersCount', { count: format.number(c.peerCount) })}
                  </Badge>
                ) : null}
              </span>
            ),
          },
          {
            key: 'ping',
            header: t('clients.table.ping'),
            render: (c: VPNClient) => c.pingTime || '–',
            sortValue: (c: VPNClient) => leadingNumber(c.pingTime) ?? c.pingTime,
          },
          {
            key: 'traffic',
            header: t('clients.table.traffic'),
            sortValue: (c: VPNClient) => (c.rxByte ?? 0) + (c.txByte ?? 0),
            render: (c: VPNClient) => {
              const rx = c.rxByte ?? 0;
              const tx = c.txByte ?? 0;
              return (
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 84,
                    }}
                  >
                    <ArrowDown size={14} color={colors.success} aria-hidden />
                    {format.bytes(rx)}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 84,
                    }}
                  >
                    <ArrowUp size={14} color={colors.warning} aria-hidden />
                    {format.bytes(tx)}
                  </span>
                </span>
              );
            },
          },
          {
            key: 'lastLink',
            header: t('clients.table.lastLink'),
            sortValue: (c: VPNClient) => (c.running ? c.lastLinkUp : c.lastLinkDown),
            render: (c: VPNClient) => {
              const ts = c.running ? c.lastLinkUp : c.lastLinkDown;
              if (!ts) return '–';
              return c.running
                ? t('clients.table.lastConnected', { time: ts })
                : t('clients.table.lastDisconnected', { time: ts });
            },
          },
          {
            key: 'enabled',
            header: t('shared.enabled'),
            sortValue: (c: VPNClient) => checkedFor(c),
            render: (c: VPNClient) => {
              const busy = isPending(c.id);
              const next = !checkedFor(c);
              return (
                <Switch
                  aria-label={t('shared.enabled')}
                  checked={checkedFor(c)}
                  disabled={!creds || busy}
                  onChange={async () => {
                    if (!creds) return;
                    setOptimistic((m) => ({ ...m, [c.id]: next }));
                    setRowsPending([c.id], true);
                    try {
                      await updateVPNClient(creds, c.name, { disabled: !next });
                    } catch (err) {
                      setOptimistic((m) => {
                        const reverted = { ...m };
                        delete reverted[c.id];
                        return reverted;
                      });
                      const message =
                        err instanceof ApiError
                          ? err.message
                          : err instanceof Error
                            ? err.message
                            : t('clients.toast.updateFailedDescription');
                      toast.notify({
                        title: t('clients.toast.updateFailed'),
                        description: message,
                        tone: 'danger',
                      });
                    } finally {
                      setRowsPending([c.id], false);
                      onToggled();
                    }
                  }}
                />
              );
            },
            width: '120px',
          },
          {
            key: 'failoverRole',
            header: t('clients.table.failoverRole'),
            sortValue: (c: VPNClient) =>
              c.failoverRole ? ROLES.indexOf(c.failoverRole) : ROLES.length,
            render: (c: VPNClient) => (
              <span
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'flex-start',
                }}
              >
                {c.failoverRole ? (
                  <Badge tone={c.failoverRole === 'standby' ? 'neutral' : 'warning'}>
                    {t(`clients.table.role.${c.failoverRole}`)}
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!creds || !checkedFor(c)}
                  title={t('clients.table.setRoleFor', { name: c.name })}
                  aria-label={t('clients.table.setRoleFor', { name: c.name })}
                  onClick={() => setRoleTarget(c)}
                >
                  {t('clients.table.setRole')}
                </Button>
              </span>
            ),
            width: '150px',
          },
          {
            key: 'actions',
            header: t('shared.actions'),
            sortable: false,
            render: (c: VPNClient) => {
              const editable = EDITABLE_PROTOCOLS.has(c.protocol);
              return (
                <span style={{ display: 'inline-flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!creds}
                    title={t('clients.table.resetTrafficFor', { name: c.name })}
                    aria-label={t('clients.table.resetTrafficFor', { name: c.name })}
                    onClick={() => onResetTraffic(c)}
                  >
                    <RotateCcw size={14} aria-hidden />
                  </Button>
                  {editable ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!creds}
                      title={t('shared.editNamed', { name: c.name })}
                      aria-label={t('shared.editNamed', { name: c.name })}
                      onClick={() => onEdit(c)}
                    >
                      <Pencil size={14} aria-hidden />
                    </Button>
                  ) : null}
                  {editable ? (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={!creds}
                      title={t('shared.deleteNamed', { name: c.name })}
                      aria-label={t('shared.deleteNamed', { name: c.name })}
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 size={14} aria-hidden />
                    </Button>
                  ) : null}
                </span>
              );
            },
            width: '160px',
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        emptyMessage={totalRows ? t('clients.table.noMatch') : t('clients.table.empty')}
        emptyIcon={<Cable size={32} aria-hidden />}
      />
      {roleTarget ? (
        <FailoverRoleDialog
          creds={creds}
          client={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={(role) => {
            toast.notify({
              title: t('clients.toast.roleSet', {
                name: roleTarget.name,
                role: t(`clients.table.role.${role}`),
              }),
              tone: 'success',
            });
            setRoleTarget(null);
            onToggled();
          }}
        />
      ) : null}
    </>
  );
}
