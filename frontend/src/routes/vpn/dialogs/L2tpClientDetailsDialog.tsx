import { useEffect, useState } from 'react';
import { Badge, Button, Dialog } from '@nasnet/ui';
import styles from '../../VPNPage.module.scss';
import {
  ApiError,
  fetchL2TPClientDetails,
  isAbortError,
  type L2TPClientDetailsResponse,
  type VPNCredentials,
} from '../../../api';

interface Props {
  clientName: string | null;
  creds: VPNCredentials | null;
  onClose: () => void;
}

export function L2tpClientDetailsDialog({ clientName, creds, onClose }: Props) {
  const [details, setDetails] = useState<L2TPClientDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientName || !creds) return;
    const controller = new AbortController();
    setDetails(null);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const data = await fetchL2TPClientDetails(creds, clientName, controller.signal);
        setDetails(data);
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load L2TP client details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [clientName, creds]);

  return (
    <Dialog
      open={!!clientName}
      onClose={onClose}
      title={clientName ? `L2TP client: ${clientName}` : ''}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: 'var(--color-danger)' }}>{error}</p> : null}
      {details ? (
        <DList>
          <Row label="Name" value={details.name} />
          <Row label="Enabled" value={<BoolBadge value={!details.disabled} />} />
          <Row label="Running" value={<BoolBadge value={details.running} />} />
          <Row label="Status" value={details.status} />
          <Row label="Uptime" value={details.uptime} />
          <Row label="Encoding" value={details.encoding} />
          <Row label="Connect to" value={details.connectTo} />
          <Row label="Local address" value={details.localAddress} />
          <Row label="Remote address" value={details.remoteAddress} />
          <Row label="Local IPv6 address" value={details.localIpv6Address} />
          <Row label="Remote IPv6 address" value={details.remoteIpv6Address} />
          <Row label="User" value={details.user} />
          <Row label="Password" value={details.password ? <code>{details.password}</code> : '–'} />
          <Row label="Profile" value={details.profile} />
          <Row label="Allow" value={details.allow} />
          <Row label="MTU" value={details.mtu} />
          <Row label="Max MTU" value={details.maxMtu} />
          <Row label="Max MRU" value={details.maxMru} />
          <Row label="MRRU" value={details.mrru} />
          <Row label="Keepalive timeout" value={`${details.keepaliveTimeout}s`} />
          <Row label="L2TP version" value={details.l2tpProtoVersion} />
          <Row label="L2TPv3 digest" value={details.l2tpv3DigestHash} />
          <Row label="Use peer DNS" value={<BoolBadge value={details.usePeerDns} />} />
          <Row label="Use IPsec" value={<BoolBadge value={details.useIPsec} />} />
          <Row
            label="IPsec secret"
            value={details.ipsecSecret ? <code>{details.ipsecSecret}</code> : '–'}
            wide
          />
          <Row label="Allow fast path" value={<BoolBadge value={details.allowFastPath} />} />
          <Row label="Add default route" value={<BoolBadge value={details.addDefaultRoute} />} />
          <Row label="Add routes" value={<BoolBadge value={details.addRoutes} />} />
          <Row label="Dial on demand" value={<BoolBadge value={details.dialOnDemand} />} />
          <Row label="Random source port" value={<BoolBadge value={details.randomSourcePort} />} />
          {details.comment ? <Row label="Comment" value={details.comment} wide /> : null}
        </DList>
      ) : null}
    </Dialog>
  );
}

function DList({ children }: { children: React.ReactNode }) {
  return <dl className={styles.detailsList}>{children}</dl>;
}

function Row({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <>
      <dt className={styles.detailsLabel}>{label}</dt>
      <dd className={`${styles.detailsValue}${wide ? ` ${styles.detailsValueWide}` : ''}`}>
        {empty ? '–' : value}
      </dd>
    </>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return <Badge tone={value ? 'success' : 'neutral'}>{value ? 'Yes' : 'No'}</Badge>;
}
