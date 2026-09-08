import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Network } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  Skeleton,
} from '@nasnet/ui';
import styles from './BridgePortsCard.module.scss';
import {
  fetchBridgePorts,
  fetchBridges,
  type BridgePortResponse,
  type BridgeResponse,
  type SystemCredentials,
} from '../../api';
import { BridgeChangeDialog } from './BridgeChangeDialog';
import { bridgeDescription, bridgeLabel } from './bridgeTypes';

interface BridgePortsCardProps {
  creds: SystemCredentials | null;
  openForInterface?: string | null;
  onOpenHandled?: () => void;
}

export function BridgePortsCard({ creds, openForInterface, onOpenHandled }: BridgePortsCardProps) {
  const [ports, setPorts] = useState<BridgePortResponse[]>([]);
  const [bridges, setBridges] = useState<BridgeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portToChange, setPortToChange] = useState<BridgePortResponse | null>(null);

  const host = creds?.host;
  const username = creds?.username;
  const password = creds?.password;

  const reload = useCallback(async () => {
    if (!host || !username || !password) {
      setPorts([]);
      setBridges([]);
      setLoading(false);
      setError('Missing router credentials for this session.');
      return;
    }
    const full = { host, username, password };
    setError(null);
    const [pResult, bResult] = await Promise.allSettled([
      fetchBridgePorts(full),
      fetchBridges(full),
    ]);
    if (pResult.status === 'fulfilled') {
      setPorts(pResult.value);
    } else {
      setPorts([]);
      setError(
        pResult.reason instanceof Error ? pResult.reason.message : 'Failed to load bridge ports.',
      );
    }
    setBridges(bResult.status === 'fulfilled' ? bResult.value : []);
    setLoading(false);
  }, [host, username, password]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!openForInterface || loading) return;
    const match = ports.find((p) => p.interface === openForInterface);
    if (match) setPortToChange(match);
    onOpenHandled?.();
  }, [openForInterface, loading, ports, onOpenHandled]);

  const columns: DataTableColumn<BridgePortResponse>[] = [
    {
      key: 'interface',
      header: 'Interface',
      render: (r) => <span className={styles.mono}>{r.interface}</span>,
    },
    {
      key: 'bridge',
      header: 'Bridge',
      render: (r) => <span>{bridgeLabel(r.bridge)}</span>,
    },
    {
      key: 'behaviour',
      header: 'Behaviour',
      render: (r) => {
        const description = bridgeDescription(r.bridge, r.comment);
        return description ? (
          <span className={styles.description}>{description}</span>
        ) : (
          <span className={styles.muted}>—</span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (r) => (
        <div className={styles.rowActions}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPortToChange(r)}
            aria-label={`Change bridge for ${r.interface}`}
            title="Change bridge"
          >
            <ArrowLeftRight size={14} aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card data-testid="bridge-ports">
      <CardHeader>
        <CardTitle>Bridge ports</CardTitle>
        <CardDescription>
          Which bridge each LAN port belongs to, and therefore how its traffic is routed.
        </CardDescription>
      </CardHeader>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {loading ? (
        <div data-testid="bridge-ports-skeleton" className={styles.skeleton}>
          <Skeleton height={14} />
          <Skeleton height={14} />
          <Skeleton height={14} />
        </div>
      ) : ports.length === 0 ? (
        <div className={styles.empty}>
          <Network size={22} aria-hidden className={styles.emptyIcon} />
          <p>No LAN bridge ports on this router.</p>
        </div>
      ) : (
        <DataTable columns={columns} rows={ports} rowKey={(r) => r.id || r.interface} />
      )}

      {portToChange && creds ? (
        <BridgeChangeDialog
          open
          port={portToChange}
          bridges={bridges}
          creds={creds}
          onClose={() => setPortToChange(null)}
          onChanged={() => {
            void reload();
          }}
        />
      ) : null}
    </Card>
  );
}
