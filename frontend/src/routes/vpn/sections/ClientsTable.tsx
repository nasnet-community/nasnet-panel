import { useState } from 'react';
import { Badge, Button, DataTable, Switch, useToast } from '@nasnet/ui';
import { ArrowDown, ArrowUp, Cable, Pencil, Trash2 } from 'lucide-react';
import { ApiError, updateVPNClient, type VPNClient, type VPNCredentials } from '../../../api';
import { formatBytes } from '../../../utils/format';
import { useThemeColors } from '../../../utils/theme-colors';

interface Props {
  rows: VPNClient[];
  totalRows: number;
  creds: VPNCredentials | null;
  onToggled: () => void;
  onView: (client: VPNClient) => void;
  onEdit: (client: VPNClient) => void;
  onDelete: (client: VPNClient) => void;
}

export function ClientsTable({
  rows,
  totalRows,
  creds,
  onToggled,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const toast = useToast();
  const colors = useThemeColors();
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const isPending = (id: string) => pending.has(id);
  const checkedFor = (c: VPNClient) => optimistic[c.id] ?? c.enabled;

  const setRowPending = (id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <DataTable
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (c: VPNClient) => {
            if (c.protocol !== 'l2tp') return c.name;
            return (
              <button
                type="button"
                onClick={() => onView(c)}
                aria-label={`View ${c.name} details`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  color: 'var(--color-primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {c.name}
              </button>
            );
          },
        },
        {
          key: 'status',
          header: 'Status',
          render: (c: VPNClient) => (
            <Badge tone={c.running ? 'success' : 'neutral'}>
              {c.running ? 'Connected' : 'Disconnected'}
            </Badge>
          ),
        },
        {
          key: 'protocol',
          header: 'Protocol',
          render: (c: VPNClient) => <Badge tone="info">{c.protocol.toUpperCase()}</Badge>,
        },
        {
          key: 'traffic',
          header: 'Traffic',
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
                {formatBytes(rx)}
                <span aria-hidden> / </span>
                <ArrowUp size={14} color={colors.warning} aria-hidden />
                {formatBytes(tx)}
              </span>
            );
          },
        },
        {
          key: 'lastLink',
          header: 'Last link',
          render: (c: VPNClient) => {
            const ts = c.running ? c.lastLinkUp : c.lastLinkDown;
            const label = c.running ? 'Connected' : 'Disconnected';
            return ts ? `${label}: ${ts}` : '–';
          },
        },
        {
          key: 'enabled',
          header: 'Enabled',
          render: (c: VPNClient) => {
            const busy = isPending(c.id);
            const next = !checkedFor(c);
            return (
              <Switch
                aria-label="Enabled"
                checked={checkedFor(c)}
                disabled={!creds || busy}
                onChange={async () => {
                  if (!creds) return;
                  setOptimistic((m) => ({ ...m, [c.id]: next }));
                  setRowPending(c.id, true);
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
                          : 'Failed to update client.';
                    toast.notify({
                      title: 'Failed to update client',
                      description: message,
                      tone: 'danger',
                    });
                  } finally {
                    setRowPending(c.id, false);
                    onToggled();
                  }
                }}
              />
            );
          },
          width: '120px',
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (c: VPNClient) => {
            if (c.protocol !== 'l2tp' && c.protocol !== 'wireguard') return null;
            return (
              <span style={{ display: 'inline-flex', gap: 8 }}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!creds}
                  title={`Edit ${c.name}`}
                  aria-label={`Edit ${c.name}`}
                  onClick={() => onEdit(c)}
                >
                  <Pencil size={14} aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!creds}
                  title={`Delete ${c.name}`}
                  aria-label={`Delete ${c.name}`}
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
      emptyMessage={totalRows ? 'No clients match the current filters.' : 'No VPN clients yet.'}
      emptyIcon={<Cable size={32} aria-hidden />}
    />
  );
}
