import { useState } from 'react';
import { Card, Stack, useToast } from '@nasnet/ui';
import {
  ApiError,
  addL2TPClient,
  type AddL2TPClientRequest,
  type VPNClient,
  type VPNCredentials,
} from '../../../api';
// import { ConfirmDialog } from '@nasnet/ui';
// import { useClientActions } from '../hooks/useClientActions';
import { AddVpnClientDialog } from '../dialogs/AddVpnClientDialog';
import { PaginationControls } from '../PaginationControls';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { PAGE_SIZE } from '../utils';
import { ClientsTable } from './ClientsTable';
import { SectionHeader } from './SectionHeader';

const matches = (c: VPNClient, q: string) =>
  c.name.toLowerCase().includes(q) ||
  (c.endpoint ?? '').toLowerCase().includes(q) ||
  (c.username ?? '').toLowerCase().includes(q) ||
  (c.comment ?? '').toLowerCase().includes(q);

interface Props {
  creds: VPNCredentials | null;
  clients: VPNClient[];
  onChanged: () => void;
}

export function ClientsSection({ creds, clients, onChanged }: Props) {
  const paged = usePagedFilter(clients, matches);
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  // Edit/Delete still hidden until the backend exposes those endpoints.
  // const [deletingId, setDeletingId] = useState<string | null>(null);

  const onSubmitL2TP = async (req: AddL2TPClientRequest) => {
    if (!creds) {
      toast.notify({ title: 'Not connected to router', tone: 'danger' });
      return;
    }
    try {
      await addL2TPClient(creds, req);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add L2TP client.';
      toast.notify({ title: 'Failed to add VPN client', description: message, tone: 'danger' });
      throw err;
    }
    setAdding(false);
    toast.notify({ title: `L2TP client "${req.name}" added`, tone: 'success' });
    onChanged();
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title="VPN Clients"
          count={clients.length}
          description="Outbound VPN interfaces (WireGuard, L2TP, OpenVPN, PPTP, SSTP, IKEv2)."
          search={{
            value: paged.search,
            placeholder: 'Search clients…',
            ariaLabel: 'Search clients',
            onChange: paged.setSearch,
          }}
          action={{
            label: 'Add client',
            disabled: !creds,
            onClick: () => setAdding(true),
          }}
        />
        <div style={{ marginTop: 16 }}>
          <ClientsTable
            rows={paged.pagedRows}
            totalRows={clients.length}
            creds={creds}
            onToggled={onChanged}
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
      {adding ? (
        <AddVpnClientDialog onCancel={() => setAdding(false)} onSubmitL2TP={onSubmitL2TP} />
      ) : null}
      {/* <ConfirmDialog
        open={!!deletingId}
        title="Delete VPN client"
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeletingId(null)}
      /> */}
    </Stack>
  );
}
