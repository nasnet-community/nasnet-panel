import { Badge, DataTable } from '@nasnet/ui';
import { Server as ServerIcon } from 'lucide-react';
import type { VPNServer } from '../../../api';

interface Props {
  rows: VPNServer[];
  totalRows: number;
  onRowClick?: (server: VPNServer) => void;
}

export function ServersTable({ rows, totalRows, onRowClick }: Props) {
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
          key: 'remoteIp',
          header: 'Remote IP',
          render: (s: VPNServer) => {
            if (!s.remoteIp && !s.ipPool) return '–';
            if (s.remoteIp && s.ipPool) return `${s.remoteIp} (${s.ipPool})`;
            return s.remoteIp || s.ipPool;
          },
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
