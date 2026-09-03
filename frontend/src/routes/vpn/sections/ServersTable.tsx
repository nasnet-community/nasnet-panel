import { Badge, Button, DataTable } from '@nasnet/ui';
import { Pencil, Power, PowerOff, Server as ServerIcon, Trash2 } from 'lucide-react';
import type { VPNServer } from '../../../api';

interface Props {
  rows: VPNServer[];
  totalRows: number;
  onRowClick?: (server: VPNServer) => void;
  onEdit?: (server: VPNServer) => void;
  onDelete?: (server: VPNServer) => void;
  onDisable?: (server: VPNServer) => void;
  onToggleEnabled?: (server: VPNServer) => void;
  canMutate?: boolean;
  peerCounts?: Record<string, number>;
}

const isDeletable = (s: VPNServer) => s.protocol === 'openvpn' || s.protocol === 'wireguard';
const isEditable = (s: VPNServer) => s.protocol === 'wireguard';
const isDisableable = (s: VPNServer) => s.protocol === 'sstp' && s.running;
const isToggleable = (s: VPNServer) => s.protocol === 'openvpn';

export function ServersTable({
  rows,
  totalRows,
  onRowClick,
  onEdit,
  onDelete,
  onDisable,
  onToggleEnabled,
  canMutate = false,
  peerCounts = {},
}: Props) {
  return (
    <DataTable
      columns={[
        { key: 'name', header: 'Name', render: (s: VPNServer) => s.name },
        {
          key: 'protocol',
          header: 'Protocol',
          render: (s: VPNServer) => <Badge tone="info">{s.protocol.toUpperCase()}</Badge>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (s: VPNServer) => (
            <Badge tone={s.running ? 'success' : 'neutral'}>
              {s.running ? 'Running' : 'Disabled'}
            </Badge>
          ),
        },
        {
          key: 'port',
          header: 'Port',
          render: (s: VPNServer) => {
            if (!s.listenPort) return '–';
            if (!s.transport) return s.listenPort;
            const transport = s.transport.toLowerCase();
            const tone = transport === 'tcp' ? 'primary' : transport === 'udp' ? 'info' : 'neutral';
            return <Badge tone={tone}>{`${transport}:${s.listenPort}`}</Badge>;
          },
        },
        {
          key: 'peers',
          header: 'Peers',
          render: (s: VPNServer) => {
            if (s.protocol !== 'wireguard') return '–';
            const count = peerCounts[s.id];
            if (count === undefined) return '–';
            const label = `${count} ${count === 1 ? 'peer' : 'peers'} on ${s.name}`;
            return (
              <Badge tone="neutral" title={label} aria-label={label}>
                {count}
              </Badge>
            );
          },
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (s: VPNServer) => {
            const editable = isEditable(s);
            const deletable = isDeletable(s);
            const disableable = isDisableable(s);
            const toggleable = isToggleable(s);
            if (!editable && !deletable && !disableable && !toggleable) return null;
            const toggleLabel = `${s.running ? 'Disable' : 'Enable'} ${s.name}`;
            return (
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {editable && onEdit ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canMutate}
                    title={`Edit ${s.name}`}
                    aria-label={`Edit ${s.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(s);
                    }}
                  >
                    <Pencil size={14} aria-hidden />
                  </Button>
                ) : null}
                {toggleable && onToggleEnabled ? (
                  <Button
                    size="sm"
                    variant={s.running ? 'danger' : 'secondary'}
                    disabled={!canMutate}
                    title={toggleLabel}
                    aria-label={toggleLabel}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(s);
                    }}
                  >
                    {s.running ? (
                      <PowerOff size={14} aria-hidden />
                    ) : (
                      <Power size={14} aria-hidden />
                    )}
                  </Button>
                ) : null}
                {deletable && onDelete ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canMutate}
                    title={`Delete ${s.name}`}
                    aria-label={`Delete ${s.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(s);
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                  </Button>
                ) : null}
                {disableable && onDisable ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canMutate}
                    title={`Disable ${s.name}`}
                    aria-label={`Disable ${s.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisable(s);
                    }}
                  >
                    <Power size={14} aria-hidden />
                  </Button>
                ) : null}
              </span>
            );
          },
          width: '160px',
        },
      ]}
      rows={rows}
      rowKey={(s) => s.id}
      onRowClick={onRowClick}
      emptyMessage={
        totalRows ? 'No servers match the current filters.' : 'No VPN servers configured.'
      }
      emptyIcon={<ServerIcon size={32} aria-hidden />}
    />
  );
}
