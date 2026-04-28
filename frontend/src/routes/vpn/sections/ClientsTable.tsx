import { useState } from 'react';
import { Badge, DataTable, Switch, useToast } from '@nasnet/ui';
import { Cable } from 'lucide-react';
import { ApiError, updateVPNClient, type VPNClient, type VPNCredentials } from '../../../api';
import { formatBytes } from '../../../utils/format';

interface Props {
  rows: VPNClient[];
  totalRows: number;
  creds: VPNCredentials | null;
  onToggled: () => void;
  // onEdit: (client: VPNClient) => void;
  // onDelete: (id: string) => void;
}

export function ClientsTable({ rows, totalRows, creds, onToggled }: Props) {
  const toast = useToast();
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
        { key: 'name', header: 'Name', render: (c: VPNClient) => c.name },
        {
          key: 'status',
          header: 'Status',
          render: (c: VPNClient) => (
            <Badge tone={c.running ? 'success' : 'neutral'}>
              {c.running ? 'Running' : 'Stopped'}
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
              <span style={{ whiteSpace: 'nowrap' }}>
                ↓ {formatBytes(rx)} / ↑ {formatBytes(tx)}
              </span>
            );
          },
        },
        {
          key: 'lastLink',
          header: 'Last link',
          render: (c: VPNClient) => {
            const ts = c.running ? c.lastLinkUp : c.lastLinkDown;
            const label = c.running ? 'Up' : 'Down';
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
        // {
        //   key: 'actions',
        //   header: 'Actions',
        //   render: (c: VPNClient) => (
        //     <span style={{ display: 'inline-flex', gap: 8 }}>
        //       <Button size="sm" variant="secondary" onClick={() => onEdit(c)}>
        //         Edit
        //       </Button>
        //       <Button size="sm" variant="danger" onClick={() => onDelete(c.id)}>
        //         Delete
        //       </Button>
        //     </span>
        //   ),
        //   width: '200px',
        // },
      ]}
      rows={rows}
      rowKey={(c) => c.id}
      emptyMessage={totalRows ? 'No clients match the current filters.' : 'No VPN clients yet.'}
      emptyIcon={<Cable size={32} aria-hidden />}
    />
  );
}
