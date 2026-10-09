import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable, Switch, useToast } from '@nasnet/ui';
import { ArrowDown, ArrowUp, Cable, Pencil, Trash2 } from 'lucide-react';
import {
  ApiError,
  fetchForeignGateway,
  updateForeignGateway,
  updateVPNClient,
  type VPNClient,
  type VPNCredentials,
} from '../../../api';
import { useFormat } from '../../../utils/useFormat';
import { useThemeColors } from '../../../utils/theme-colors';

interface Props {
  rows: VPNClient[];
  totalRows: number;
  creds: VPNCredentials | null;
  onToggled: () => void;
  onEdit: (client: VPNClient) => void;
  onDelete: (client: VPNClient) => void;
}

export function ClientsTable({ rows, totalRows, creds, onToggled, onEdit, onDelete }: Props) {
  const toast = useToast();
  const { t } = useTranslation('vpn');
  const format = useFormat();
  const colors = useThemeColors();
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [gateway, setGatewayState] = useState<string | null>(null);
  const [gatewayBusy, setGatewayBusy] = useState(false);

  useEffect(() => {
    if (!creds) return;
    const controller = new AbortController();
    fetchForeignGateway(creds, controller.signal)
      .then((g) => setGatewayState(g))
      .catch(() => {});
    return () => controller.abort();
  }, [creds]);

  const isPending = (id: string) => pending.has(id);
  const checkedFor = (c: VPNClient) => optimistic[c.id] ?? c.enabled;

  const setRowsPending = (ids: string[], on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  return (
    <DataTable
      columns={[
        {
          key: 'name',
          header: t('shared.name'),
          render: (c: VPNClient) => c.comment || c.name,
        },
        {
          key: 'status',
          header: t('shared.status'),
          render: (c: VPNClient) => (
            <Badge tone={c.running ? 'success' : 'neutral'}>
              {c.running ? t('shared.connected') : t('shared.disconnected')}
            </Badge>
          ),
        },
        {
          key: 'protocol',
          header: t('shared.protocol'),
          render: (c: VPNClient) => <Badge tone="info">{c.protocol.toUpperCase()}</Badge>,
        },
        {
          key: 'ping',
          header: t('clients.table.ping'),
          render: (c: VPNClient) => c.pingTime || '–',
        },
        {
          key: 'peers',
          header: t('servers.table.peers'),
          render: (c: VPNClient) =>
            c.protocol === 'wireguard' && c.peerCount !== undefined
              ? format.number(c.peerCount)
              : '–',
        },
        {
          key: 'traffic',
          header: t('clients.table.traffic'),
          render: (c: VPNClient) => {
            const rx = c.rxByte ?? 0;
            const tx = c.txByte ?? 0;
            return (
              <span
                style={{
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ArrowDown size={14} color={colors.success} aria-hidden />
                {format.bytes(rx)}
                <span aria-hidden> / </span>
                <ArrowUp size={14} color={colors.warning} aria-hidden />
                {format.bytes(tx)}
              </span>
            );
          },
        },
        {
          key: 'lastLink',
          header: t('clients.table.lastLink'),
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
          key: 'gateway',
          header: t('clients.table.starlinkGateway'),
          render: (c: VPNClient) => {
            if (gateway === c.name) {
              return <Badge tone="success">{t('clients.table.gateway')}</Badge>;
            }
            return (
              <Button
                size="sm"
                variant="secondary"
                disabled={!creds || !checkedFor(c) || gatewayBusy}
                title={t('clients.table.setGatewayFor', { name: c.name })}
                aria-label={t('clients.table.setGatewayFor', { name: c.name })}
                onClick={async () => {
                  if (!creds) return;
                  setGatewayBusy(true);
                  try {
                    await updateForeignGateway(creds, c.name);
                    setGatewayState(c.name);
                    toast.notify({
                      title: t('clients.toast.gatewaySet', { name: c.name }),
                      tone: 'success',
                    });
                  } catch (err) {
                    const message =
                      err instanceof ApiError
                        ? err.message
                        : err instanceof Error
                          ? err.message
                          : t('clients.toast.gatewayFailedDescription');
                    toast.notify({
                      title: t('clients.toast.gatewayFailed'),
                      description: message,
                      tone: 'danger',
                    });
                  } finally {
                    setGatewayBusy(false);
                  }
                }}
              >
                {t('clients.table.setGateway')}
              </Button>
            );
          },
          width: '150px',
        },
        {
          key: 'actions',
          header: t('shared.actions'),
          render: (c: VPNClient) => {
            if (c.protocol !== 'l2tp' && c.protocol !== 'wireguard') return null;
            return (
              <span style={{ display: 'inline-flex', gap: 8 }}>
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
              </span>
            );
          },
          width: '120px',
        },
      ]}
      rows={rows}
      rowKey={(c) => c.id}
      emptyMessage={totalRows ? t('clients.table.noMatch') : t('clients.table.empty')}
      emptyIcon={<Cable size={32} aria-hidden />}
    />
  );
}
