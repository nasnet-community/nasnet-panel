import { Badge, Button, DataTable } from '@nasnet/ui';
import { Pencil, Server as ServerIcon, Trash2 } from 'lucide-react';
import type { VPNServer } from '../../../api';

interface Props {
  rows: VPNServer[];
  totalRows: number;
  onRowClick?: (server: VPNServer) => void;
  onEdit?: (server: VPNServer) => void;
  onDelete?: (server: VPNServer) => void;
  canMutate?: boolean;
}

const isDeletable = (s: VPNServer) => s.protocol === 'openvpn' || s.protocol === 'wireguard';
const isEditable = (s: VPNServer) => s.protocol === 'wireguard';

export function ServersTable({
  rows,
  totalRows,
  onRowClick,
  onEdit,
  onDelete,
  canMutate = false,
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
          key: 'actions',
          header: 'Actions',
          render: (s: VPNServer) => {
            const editable = isEditable(s);
            const deletable = isDeletable(s);
            if (!editable && !deletable) return null;
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
              </span>
            );
          },
          width: '120px',
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
