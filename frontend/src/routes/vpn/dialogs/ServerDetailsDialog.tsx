import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, ConfirmDialog, Dialog, useToast } from '@nasnet/ui';
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import styles from '../../VPNPage.module.scss';
import {
  ApiError,
  deleteWireguardPeer,
  fetchL2tpServerDetails,
  fetchOvpnServerDetails,
  fetchPptpServerDetails,
  fetchSstpServerDetails,
  fetchWireguardDetailed,
  isAbortError,
  type L2tpServerDetailsResponse,
  type OvpnServerDetailsResponse,
  type PptpServerDetailsResponse,
  type SstpServerDetailsResponse,
  type VPNCredentials,
  type VPNServer,
  type WireguardDetailedResponse,
  type WireguardPeerResponse,
} from '../../../api';
import { AddWgPeerDialog } from './AddWgPeerDialog';
import { EditWgPeerDialog } from './EditWgPeerDialog';
import { ExportOvpnDialog } from './ExportOvpnDialog';
import { WgClientConfigDialog } from './WgClientConfigDialog';

interface PeerClientConfig {
  peerName: string;
  privateKey: string;
  serverPublicKey: string;
  presharedKey?: string;
  defaultEndpoint?: string;
  defaultAddress?: string;
  defaultAllowedIps?: string;
  persistentKeepalive?: string;
}

type Details =
  | { kind: 'openvpn'; data: OvpnServerDetailsResponse }
  | { kind: 'wireguard'; data: WireguardDetailedResponse }
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [addingPeer, setAddingPeer] = useState(false);
  const [editingPeer, setEditingPeer] = useState<WireguardPeerResponse | null>(null);
  const [configPeer, setConfigPeer] = useState<PeerClientConfig | null>(null);
  const [pendingDeletePeer, setPendingDeletePeer] = useState<WireguardPeerResponse | null>(null);
  const [peerDeleteSubmitting, setPeerDeleteSubmitting] = useState(false);
  const toast = useToast();

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

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
  }, [server, creds, refreshKey]);

  const onConfirmDeletePeer = async () => {
    if (!creds || !pendingDeletePeer) return;
    const target = pendingDeletePeer;
    setPeerDeleteSubmitting(true);
    try {
      await deleteWireguardPeer(creds, target.id || target.name);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete peer.';
      toast.notify({ title: 'Failed to delete peer', description: message, tone: 'danger' });
      setPeerDeleteSubmitting(false);
      return;
    }
    setPeerDeleteSubmitting(false);
    setPendingDeletePeer(null);
    toast.notify({ title: `Peer "${target.name}" deleted`, tone: 'info' });
    reload();
  };

  const isOvpn = server?.protocol === 'openvpn';
  const ovpnServerName = isOvpn && server ? server.id.replace(/^ovpn:/, '') : '';

  const showPeerConfig = (p: WireguardPeerResponse) => {
    if (details?.kind !== 'wireguard' || !p.privateKey) return;
    setConfigPeer({
      peerName: p.name,
      privateKey: p.privateKey,
      serverPublicKey: details.data.publicKey,
      presharedKey: p.preSharedKey,
      defaultEndpoint:
        p.clientEndpoint || (creds ? `${creds.host}:${details.data.listenPort}` : ''),
      defaultAddress:
        p.allowedAddresses && p.allowedAddresses !== '0.0.0.0/0' ? p.allowedAddresses : '',
      defaultAllowedIps: p.clientAllowedAddress || undefined,
      persistentKeepalive: p.persistentKeepalive || undefined,
    });
  };

  return (
    <>
      <Dialog
        open={!!server}
        onClose={onClose}
        title={server ? `${server.protocol.toUpperCase()} server: ${server.name}` : ''}
        size="lg"
        footer={
          <>
            {isOvpn ? (
              <Button variant="secondary" onClick={() => setExporting(true)} disabled={!creds}>
                Export .ovpn
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        {loading ? <p>Loading…</p> : null}
        {error ? <p style={{ color: 'var(--color-danger)' }}>{error}</p> : null}
        {details && server ? (
          <DetailsBody
            server={server}
            details={details}
            creds={creds}
            onAddPeer={() => setAddingPeer(true)}
            onEditPeer={setEditingPeer}
            onDeletePeer={setPendingDeletePeer}
            onShowPeerConfig={showPeerConfig}
          />
        ) : null}
      </Dialog>

      {exporting && isOvpn ? (
        <ExportOvpnDialog
          creds={creds}
          serverName={ovpnServerName}
          defaultPublicAddress={creds?.host}
          onClose={() => setExporting(false)}
        />
      ) : null}

      {addingPeer && details?.kind === 'wireguard' ? (
        <AddWgPeerDialog
          creds={creds}
          interfaceName={details.data.name}
          onCancel={() => setAddingPeer(false)}
          onCreated={(created) => {
            setAddingPeer(false);
            toast.notify({ title: 'WireGuard peer created', tone: 'success' });
            if (created.privateKey && details.kind === 'wireguard') {
              setConfigPeer({
                peerName: created.name,
                privateKey: created.privateKey,
                serverPublicKey: details.data.publicKey,
                presharedKey: created.preSharedKey,
                defaultEndpoint: creds ? `${creds.host}:${details.data.listenPort}` : '',
                defaultAddress:
                  created.allowedAddresses && created.allowedAddresses !== '0.0.0.0/0'
                    ? created.allowedAddresses
                    : '',
                persistentKeepalive: created.persistentKeepalive
                  ? String(created.persistentKeepalive)
                  : undefined,
              });
            }
            reload();
          }}
        />
      ) : null}

      {configPeer ? (
        <WgClientConfigDialog
          peerName={configPeer.peerName}
          privateKey={configPeer.privateKey}
          serverPublicKey={configPeer.serverPublicKey}
          presharedKey={configPeer.presharedKey}
          defaultEndpoint={configPeer.defaultEndpoint}
          defaultAddress={configPeer.defaultAddress}
          defaultAllowedIps={configPeer.defaultAllowedIps}
          persistentKeepalive={configPeer.persistentKeepalive}
          onClose={() => setConfigPeer(null)}
        />
      ) : null}

      {editingPeer ? (
        <EditWgPeerDialog
          creds={creds}
          peer={editingPeer}
          onCancel={() => setEditingPeer(null)}
          onSaved={() => {
            setEditingPeer(null);
            toast.notify({ title: 'WireGuard peer updated', tone: 'success' });
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingDeletePeer}
        title="Delete WireGuard peer"
        description={
          pendingDeletePeer
            ? `Remove peer "${pendingDeletePeer.name}" from this server? This cannot be undone.`
            : undefined
        }
        confirmLabel={peerDeleteSubmitting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={onConfirmDeletePeer}
        onCancel={() => (peerDeleteSubmitting ? undefined : setPendingDeletePeer(null))}
      />
    </>
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
      return { kind: 'wireguard', data: await fetchWireguardDetailed(creds, name, signal) };
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

interface DetailsBodyProps {
  server: VPNServer;
  details: Details;
  creds: VPNCredentials | null;
  onAddPeer: () => void;
  onEditPeer: (peer: WireguardPeerResponse) => void;
  onDeletePeer: (peer: WireguardPeerResponse) => void;
  onShowPeerConfig: (peer: WireguardPeerResponse) => void;
}

function DetailsBody({
  server,
  details,
  creds,
  onAddPeer,
  onEditPeer,
  onDeletePeer,
  onShowPeerConfig,
}: DetailsBodyProps) {
  switch (details.kind) {
    case 'openvpn': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label="Name" value={d.name} />
          <Row label="Enabled" value={<BoolBadge value={d.enabled} />} />
          {server.listenPort ? null : <Row label="Port" value={d.port} />}
          <Row label="Protocol" value={d.protocol} />
          <Row label="Certificate" value={d.certificate} />
          <Row
            label="Require client cert"
            value={<BoolBadge value={d.requireClientCertificate} />}
          />
        </DList>
      );
    }
    case 'wireguard': {
      const d = details.data;
      return (
        <>
          <DList>
            <SummaryRows server={server} />
            <Row label="Name" value={d.name} />
            <Row label="Enabled" value={<BoolBadge value={!d.disabled} />} />
            <Row label="Running" value={<BoolBadge value={d.running} />} />
            {server.listenPort ? null : <Row label="Listen port" value={d.listenPort} />}
            <Row label="MTU" value={d.mtu} />
            <Row label="Public key" value={<code>{d.publicKey}</code>} wide />
            <Row label="Private key" value={<code>{d.privateKey}</code>} wide />
            {d.comment ? <Row label="Comment" value={d.comment} /> : null}
          </DList>
          <PeersSection
            peers={d.peers}
            canMutate={!!creds}
            onAdd={onAddPeer}
            onEdit={onEditPeer}
            onDelete={onDeletePeer}
            onShowConfig={onShowPeerConfig}
          />
        </>
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

interface PeersSectionProps {
  peers: WireguardPeerResponse[];
  canMutate: boolean;
  onAdd: () => void;
  onEdit: (peer: WireguardPeerResponse) => void;
  onDelete: (peer: WireguardPeerResponse) => void;
  onShowConfig: (peer: WireguardPeerResponse) => void;
}

function PeersSection({
  peers,
  canMutate,
  onAdd,
  onEdit,
  onDelete,
  onShowConfig,
}: PeersSectionProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <strong>
          Peers <Badge tone="info">{peers.length}</Badge>
        </strong>
        <Button size="sm" variant="success" disabled={!canMutate} onClick={onAdd}>
          <Plus size={14} aria-hidden /> Add peer
        </Button>
      </div>
      {peers.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>No peers configured.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '6px 8px' }}>Name</th>
                <th style={{ padding: '6px 8px' }}>Allowed addresses</th>
                <th style={{ padding: '6px 8px' }}>Endpoint</th>
                <th style={{ padding: '6px 8px' }}>Last handshake</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
                <th style={{ padding: '6px 8px', width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((p) => (
                <tr key={p.id || p.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '6px 8px' }}>{p.name}</td>
                  <td style={{ padding: '6px 8px' }}>{p.allowedAddresses || '–'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {p.currentEndpointAddress
                      ? `${p.currentEndpointAddress}:${p.currentEndpointPort}`
                      : p.endpointAddress
                        ? `${p.endpointAddress}:${p.endpointPort}`
                        : '–'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>{p.lastHandshake || '–'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <BoolBadge value={!p.disabled} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ display: 'inline-flex', gap: 8 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!p.privateKey}
                        title={
                          p.privateKey
                            ? `Client config for ${p.name}`
                            : 'Private key not stored on router'
                        }
                        aria-label={`Client config for peer ${p.name}`}
                        onClick={() => onShowConfig(p)}
                      >
                        <QrCode size={14} aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canMutate}
                        title={`Edit ${p.name}`}
                        aria-label={`Edit peer ${p.name}`}
                        onClick={() => onEdit(p)}
                      >
                        <Pencil size={14} aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!canMutate}
                        title={`Delete ${p.name}`}
                        aria-label={`Delete peer ${p.name}`}
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 size={14} aria-hidden />
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
