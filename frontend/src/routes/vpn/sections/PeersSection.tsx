import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Stack } from '@nasnet/ui';
import type { VPNPeer, VPNServer } from '../../../api';
import { PeerFormDialog } from '../dialogs/PeerFormDialog';
import { PaginationControls } from '../PaginationControls';
import { usePeerActions } from '../hooks/usePeerActions';
import { PAGE_SIZE } from '../utils';
import { PeersTable } from './PeersTable';
import { SectionHeader } from './SectionHeader';

interface Props {
  routerId: string;
  peers: VPNPeer[];
  servers: VPNServer[];
  onChanged: () => void;
}

export function PeersSection({ routerId, peers, servers, onChanged }: Props) {
  const { t } = useTranslation('vpn');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const defaultServer = servers[0];
  const actions = usePeerActions(routerId, defaultServer, onChanged);

  const totalPages = Math.max(1, Math.ceil(peers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedPeers = useMemo(
    () => peers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [peers, currentPage],
  );

  const onAdd = async (draft: Partial<VPNPeer>) => {
    await actions.add(draft);
    setAdding(false);
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    await actions.remove(deletingId);
    setDeletingId(null);
  };

  return (
    <Stack>
      <Card>
        <SectionHeader
          title={t('peers.title')}
          count={peers.length}
          description={t('peers.description')}
          action={{
            label: t('peers.add'),
            disabled: !defaultServer,
            onClick: () => setAdding(true),
          }}
        />
        <div style={{ marginTop: 16 }}>
          <PeersTable rows={pagedPeers} hasServer={!!defaultServer} onDelete={setDeletingId} />
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            total={peers.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      </Card>
      {adding ? <PeerFormDialog onCancel={() => setAdding(false)} onSave={onAdd} /> : null}
      <ConfirmDialog
        open={!!deletingId}
        title={t('peers.deleteTitle')}
        destructive
        onConfirm={onConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </Stack>
  );
}
