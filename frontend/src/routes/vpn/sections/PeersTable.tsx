import { useTranslation } from 'react-i18next';
import { Button, DataTable } from '@nasnet/ui';
import type { VPNPeer } from '../../../api';

interface Props {
  rows: VPNPeer[];
  hasServer: boolean;
  onDelete: (id: string) => void;
}

export function PeersTable({ rows, hasServer, onDelete }: Props) {
  const { t } = useTranslation('vpn');
  return (
    <DataTable
      columns={[
        { key: 'name', header: t('shared.name'), render: (p: VPNPeer) => p.name },
        { key: 'allowed', header: t('shared.allowedIps'), render: (p: VPNPeer) => p.allowedIps },
        {
          key: 'actions',
          header: t('shared.actions'),
          render: (p: VPNPeer) => (
            <Button size="sm" variant="danger" onClick={() => onDelete(p.id)}>
              {t('shared.delete')}
            </Button>
          ),
        },
      ]}
      rows={rows}
      rowKey={(p) => p.id}
      emptyMessage={hasServer ? t('peers.empty') : t('peers.noServer')}
    />
  );
}
