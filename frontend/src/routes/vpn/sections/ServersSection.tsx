import { useState } from 'react';
import { Card, Stack } from '@nasnet/ui';
import type { VPNCredentials, VPNServer } from '../../../api';
// import { useToast } from '@nasnet/ui';
// import { api, type VPNProtocol } from '../../../api';
// import { ServerFormDialog } from '../dialogs/ServerFormDialog';
import { ServerDetailsDialog } from '../dialogs/ServerDetailsDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { ServersTable } from './ServersTable';
import { SectionHeader } from './SectionHeader';

const matches = (s: VPNServer, q: string) =>
  s.name.toLowerCase().includes(q) ||
  (s.ipPool ?? '').toLowerCase().includes(q) ||
  (s.remoteIp ?? '').toLowerCase().includes(q) ||
  (s.dns ?? '').toLowerCase().includes(q) ||
  String(s.listenPort).includes(q);

interface Props {
  creds: VPNCredentials | null;
  servers: VPNServer[];
}

export function ServersSection({ creds, servers }: Props) {
  const paged = usePagedFilter(servers, matches);
  const [selected, setSelected] = useState<VPNServer | null>(null);
  // Add server is hidden until the backend exposes a server-create endpoint.
  // const [editing, setEditing] = useState<Partial<VPNServer> | null>(null);
  // const toast = useToast();

  // const save = async (draft: Partial<VPNServer>) => {
  //   await api.vpn.createServer({
  //     routerId,
  //     name: draft.name ?? 'new-server',
  //     protocol: (draft.protocol ?? 'wireguard') as VPNProtocol,
  //     listenPort: draft.listenPort ?? 51820,
  //     ipPool: draft.ipPool ?? '10.8.0.0/24',
  //     dns: draft.dns,
  //     running: true,
  //   });
  //   setEditing(null);
  //   onChanged();
  //   toast.notify({ title: 'Server created', tone: 'success' });
  // };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="VPN Servers"
          count={servers.length}
          description="Listen for inbound VPN connections."
          search={{
            value: paged.search,
            placeholder: 'Search servers…',
            ariaLabel: 'Search servers',
            onChange: paged.setSearch,
          }}
          // action={{
          //   label: 'Add server',
          //   onClick: () => setEditing({ protocol: 'wireguard', listenPort: 51820 }),
          // }}
        />
        <div style={{ marginTop: 16 }}>
          <ServersTable
            rows={paged.pagedRows}
            totalRows={servers.length}
            onRowClick={setSelected}
          />
          <PaginationControls
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.filteredCount}
            pageSize={PAGE_SIZE}
            onPrev={paged.onPrev}
            onNext={paged.onNext}
          />
        </div>
      </Card>
      {/* {editing ? (
        <ServerFormDialog value={editing} onCancel={() => setEditing(null)} onSave={save} />
      ) : null} */}
      <ServerDetailsDialog server={selected} creds={creds} onClose={() => setSelected(null)} />
    </Stack>
  );
}
