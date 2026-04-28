import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Globe, Pencil, RefreshCw, SearchX } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Inline,
  Skeleton,
  Stack,
} from '@nasnet/ui';
import styles from './DNSPage.module.scss';
import { DNSEditDialog } from './DNSEditDialog';
import { fetchDnsInfo, type DnsCredentials, type DnsInfoResponse } from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';

export function DNSPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();

  const [info, setInfo] = useState<DnsInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const creds = useMemo<DnsCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(async () => {
    if (!creds) {
      setLoading(false);
      setError('Missing router credentials for this session.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDnsInfo(creds);
      setInfo(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DNS configuration.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const dohActive = Boolean(info?.dohServer);

  return (
    <Stack>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <div>
            <CardTitle>
              <Inline>
                <Globe size={16} aria-hidden /> DNS
              </Inline>
            </CardTitle>
            <CardDescription>
              RouterOS DNS configuration. Static servers, DHCP-supplied servers, and DoH endpoint.
            </CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Button size="sm" variant="secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={14} aria-hidden /> Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setEditing(true)}
              disabled={!info || loading || !creds}
            >
              <Pencil size={14} aria-hidden /> Edit
            </Button>
          </div>
        </CardHeader>

        {loading && !info ? (
          <div className={styles.skeletonGrid} data-testid="dns-skeleton">
            <Skeleton width={140} height={14} />
            <Skeleton height={36} />
            <Skeleton width={140} height={14} />
            <Skeleton height={36} />
            <Skeleton width={140} height={14} />
            <Skeleton height={14} />
          </div>
        ) : error ? (
          <div className={styles.errorNote}>
            <SearchX size={28} aria-hidden className={styles.errorIcon} />
            <p>{error}</p>
          </div>
        ) : info ? (
          <Stack $gap="var(--space-md)">
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Static DNS servers</span>
              <div className={styles.infoValue}>
                {info.servers.length > 0 ? (
                  <div className={styles.serverColumn}>
                    {info.servers.map((s) => (
                      <span key={`static-${s}`} className={styles.serverPill}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.muted}>None configured</span>
                )}
              </div>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>DNS over HTTPS</span>
              <div className={styles.infoValue}>
                {dohActive ? (
                  <Stack $gap="var(--space-xs)">
                    <Badge tone="success">
                      <Inline $gap="4px" $align="center">
                        <Check size={12} aria-hidden /> Active
                      </Inline>
                    </Badge>
                    <span className={styles.serverPill}>{info.dohServer}</span>
                  </Stack>
                ) : (
                  <span className={styles.muted}>Disabled</span>
                )}
              </div>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Dynamic servers</span>
              <div className={styles.infoValue}>
                {info.dynamicServers.length > 0 ? (
                  <div className={styles.serverColumn}>
                    {info.dynamicServers.map((s) => (
                      <span key={`dynamic-${s}`} className={styles.serverPill}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.muted}>None received</span>
                )}
                <div className={styles.fieldHint}>Read-only. Supplied by DHCP / PPP peers.</div>
              </div>
            </div>
          </Stack>
        ) : null}
      </Card>

      {info && creds ? (
        <DNSEditDialog
          open={editing}
          initial={info}
          creds={creds}
          onClose={() => setEditing(false)}
          onSaved={() => {
            void reload();
          }}
        />
      ) : null}
    </Stack>
  );
}
