import { useEffect, useState } from 'react';
import { Badge, Button, Dialog } from '@nasnet/ui';
import {
  ApiError,
  fetchL2tpServerDetails,
  fetchOvpnServerDetails,
  fetchPptpServerDetails,
  fetchSstpServerDetails,
  fetchWireguardServerDetails,
  isAbortError,
  type L2tpServerDetailsResponse,
  type OvpnServerDetailsResponse,
  type PptpServerDetailsResponse,
  type SstpServerDetailsResponse,
  type VPNCredentials,
  type VPNServer,
  type WireguardServerDetailsResponse,
} from '../../../api';

type Details =
  | { kind: 'openvpn'; data: OvpnServerDetailsResponse }
  | { kind: 'wireguard'; data: WireguardServerDetailsResponse }
  | { kind: 'pptp'; data: PptpServerDetailsResponse }
  | { kind: 'l2tp'; data: L2tpServerDetailsResponse }
  | { kind: 'sstp'; data: SstpServerDetailsResponse };

interface Props {
  server: VPNServer | null;
  creds: VPNCredentials | null;
  onClose: () => void;
}

export function ServerDetailsDialog({ server, creds, onClose }: Props) {
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!server || !creds) return;
    const controller = new AbortController();
    setDetails(null);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const next = await loadDetails(server, creds, controller.signal);
        setDetails(next);
      } catch (err) {
        if (isAbortError(err)) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load server details.';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [server, creds]);

  return (
    <Dialog
      open={!!server}
      onClose={onClose}
      title={server ? `${server.protocol.toUpperCase()} server: ${server.name}` : ''}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: 'var(--color-danger)' }}>{error}</p> : null}
      {details && server ? <DetailsBody server={server} details={details} /> : null}
    </Dialog>
  );
}

async function loadDetails(
  server: VPNServer,
  creds: VPNCredentials,
  signal: AbortSignal,
): Promise<Details> {
  switch (server.protocol) {
    case 'openvpn': {
      const name = server.id.replace(/^ovpn:/, '');
      return { kind: 'openvpn', data: await fetchOvpnServerDetails(creds, name, signal) };
    }
    case 'wireguard': {
      const name = server.id.replace(/^wg:/, '');
      return { kind: 'wireguard', data: await fetchWireguardServerDetails(creds, name, signal) };
    }
    case 'pptp':
      return { kind: 'pptp', data: await fetchPptpServerDetails(creds, signal) };
    case 'l2tp':
      return { kind: 'l2tp', data: await fetchL2tpServerDetails(creds, signal) };
    case 'sstp':
      return { kind: 'sstp', data: await fetchSstpServerDetails(creds, signal) };
    default:
      throw new Error(`No detail endpoint for protocol "${server.protocol}".`);
  }
}

function SummaryRows({ server }: { server: VPNServer }) {
  return (
    <>
      {server.listenPort ? <Row label="Port" value={server.listenPort} /> : null}
      {server.localIp ? <Row label="Local IP" value={server.localIp} /> : null}
      {server.localIpPool ? <Row label="Local IP pool" value={server.localIpPool} /> : null}
      {server.remoteIp ? <Row label="Remote IP" value={server.remoteIp} /> : null}
      {server.ipPool ? <Row label="Remote IP pool" value={server.ipPool} /> : null}
    </>
  );
}

function DetailsBody({ server, details }: { server: VPNServer; details: Details }) {
  switch (details.kind) {
    case 'openvpn': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Name" value={d.name} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          {server.listenPort ? null : <Row label="Port" value={d.port} />}
          <Row label="Mode" value={d.mode} />
          <Row label="Protocol" value={d.protocol} />
          <Row label="MAC address" value={d.macAddress} />
          <Row label="Certificate" value={d.certificate} />
          <Row
            label="Require client cert"
            value={<BoolBadge value={d.requireClientCertificate} />}
          />
          <Row label="Auth" value={d.auth} />
          <Row label="Cipher" value={d.cipher} />
          <Row label="User auth method" value={d.userAuthMethod} />
        </DList>
      );
    }
    case 'wireguard': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Name" value={d.name} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          <Row label="Running" value={<BoolBadge value={d.running} />} />
          {server.listenPort ? null : <Row label="Port" value={d.port} />}
          <Row label="Public key" value={<code>{d.publicKey}</code>} wide />
          <Row label="Private key" value={<code>{d.privateKey}</code>} wide />
        </DList>
      );
    }
    case 'pptp': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          <Row label="Auth" value={d.auth} />
          <Row label="Profile" value={d.profile} />
          {server.localIp ? null : <Row label="Local address" value={d.localAddress} />}
          {server.remoteIp ? null : <Row label="Remote address" value={d.remoteAddress} />}
          <Row label="DNS server" value={d.dnsServer} />
          <Row label="Use compression" value={d.useCompression} />
          <Row label="Use encryption" value={d.useEncryption} />
          <Row label="Only one" value={d.onlyOne} />
          <Row label="Change TCP MSS" value={d.changeTcpMss} />
          <SecretsRow secrets={d.secrets} />
        </DList>
      );
    }
    case 'l2tp': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          <Row label="Auth" value={d.auth} />
          <Row label="Profile" value={d.profile} />
          <Row label="Protocol" value={d.protocol} />
          <Row label="IPsec" value={d.ipsec} />
          <Row
            label="IPsec secret"
            value={d.ipsecSecret ? <code>{d.ipsecSecret}</code> : '–'}
            wide
          />
          <Row label="One session per host" value={<BoolBadge value={d.oneSessionPerHost} />} />
          {server.localIp ? null : <Row label="Local address" value={d.localAddress} />}
          {server.remoteIp ? null : <Row label="Remote address" value={d.remoteAddress} />}
          <Row label="DNS server" value={d.dnsServer} />
          <Row label="Use compression" value={d.useCompression} />
          <Row label="Use encryption" value={d.useEncryption} />
          <Row label="Only one" value={d.onlyOne} />
          <Row label="Change TCP MSS" value={d.changeTcpMss} />
          <SecretsRow secrets={d.secrets} />
        </DList>
      );
    }
    case 'sstp': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          {server.listenPort ? null : <Row label="Port" value={d.port} />}
          <Row label="Auth" value={d.auth} />
          <Row label="Profile" value={d.profile} />
          <Row label="Certificate" value={d.certificate} />
          <Row label="Verify client cert" value={<BoolBadge value={d.verifyClientCertificate} />} />
          <Row label="TLS version" value={d.tlsVersion} />
          <Row label="Ciphers" value={d.ciphers} />
          <Row label="PFS" value={d.pfs} />
          {server.localIp ? null : <Row label="Local address" value={d.localAddress} />}
          {server.remoteIp ? null : <Row label="Remote address" value={d.remoteAddress} />}
          <Row label="DNS server" value={d.dnsServer} />
          <Row label="Use compression" value={d.useCompression} />
          <Row label="Use encryption" value={d.useEncryption} />
          <Row label="Only one" value={d.onlyOne} />
          <Row label="Change TCP MSS" value={d.changeTcpMss} />
          <SecretsRow secrets={d.secrets} />
        </DList>
      );
    }
  }
}

function DList({ children }: { children: React.ReactNode }) {
  return (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: '140px minmax(0, 1fr) 140px minmax(0, 1fr)',
        rowGap: 8,
        columnGap: 16,
        margin: 0,
      }}
    >
      {children}
    </dl>
  );
}

function Row({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <>
      <dt style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: 'var(--font-sm)',
          wordBreak: 'break-all',
          gridColumn: wide ? '2 / -1' : undefined,
        }}
      >
        {empty ? '–' : value}
      </dd>
    </>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return <Badge tone={value ? 'success' : 'neutral'}>{value ? 'Yes' : 'No'}</Badge>;
}

function SecretsRow({ secrets }: { secrets: Array<{ username: string; password: string }> }) {
  if (!secrets || secrets.length === 0) {
    return <Row label="Secrets" value="–" wide />;
  }
  return (
    <Row
      label="Secrets"
      wide
      value={
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {secrets.map((s) => (
            <li key={s.username}>
              <strong>{s.username}</strong> · <code>{s.password}</code>
            </li>
          ))}
        </ul>
      }
    />
  );
}
