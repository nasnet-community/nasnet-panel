import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, ConfirmDialog, Dialog, useToast } from '@nasnet/ui';
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import styles from '../../VPNPage.module.scss';
import i18n from '../../../i18n';
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
import { useFormat } from '../../../utils/useFormat';
import { ActiveConnectionsSection } from '../sections/ActiveConnectionsSection';
import { AddWgPeerDialog } from './AddWgPeerDialog';
import { EditWgPeerDialog } from './EditWgPeerDialog';
import { ExportOvpnDialog } from './ExportOvpnDialog';
import { WgClientConfigDialog } from './WgClientConfigDialog';

interface PeerClientConfig {
  peerName: string;
  peerNameOrID: string;
  defaultPublicAddress?: string;
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
  const { t } = useTranslation('vpn');

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
              : t('details.loadFailed');
        setError(message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [server, creds, refreshKey, t]);

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
            : t('details.peers.deleteFailedDescription');
      toast.notify({
        title: t('details.peers.deleteFailed'),
        description: message,
        tone: 'danger',
      });
      setPeerDeleteSubmitting(false);
      return;
    }
    setPeerDeleteSubmitting(false);
    setPendingDeletePeer(null);
    toast.notify({ title: t('details.peers.deleted', { name: target.name }), tone: 'info' });
    reload();
  };

  const isOvpn = server?.protocol === 'openvpn';
  const ovpnServerName = isOvpn && server ? server.id.replace(/^ovpn:/, '') : '';

  const showPeerConfig = (p: WireguardPeerResponse) => {
    if (details?.kind !== 'wireguard' || !p.privateKey) return;
    setConfigPeer({
      peerName: p.name,
      peerNameOrID: p.id || p.name,
      defaultPublicAddress: p.clientEndpoint?.split(':')[0] || creds?.host || '',
    });
  };

  return (
    <>
      <Dialog
        open={!!server}
        onClose={onClose}
        title={
          server
            ? t('details.title', { protocol: server.protocol.toUpperCase(), name: server.name })
            : ''
        }
        size="lg"
        footer={
          <>
            {isOvpn ? (
              <Button variant="secondary" onClick={() => setExporting(true)} disabled={!creds}>
                {t('details.exportOvpn')}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose}>
              {t('shared.close')}
            </Button>
          </>
        }
      >
        {loading ? <p>{t('shared.loading')}</p> : null}
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
        {server && creds ? <ActiveConnectionsSection creds={creds} server={server} /> : null}
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
            toast.notify({ title: t('details.peers.created'), tone: 'success' });
            if (created.privateKey && details.kind === 'wireguard') {
              setConfigPeer({
                peerName: created.name,
                peerNameOrID: created.name,
                defaultPublicAddress: creds?.host || '',
              });
            }
            reload();
          }}
        />
      ) : null}

      {configPeer ? (
        <WgClientConfigDialog
          creds={creds}
          peerName={configPeer.peerName}
          peerNameOrID={configPeer.peerNameOrID}
          defaultPublicAddress={configPeer.defaultPublicAddress}
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
            toast.notify({ title: t('details.peers.updated'), tone: 'success' });
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingDeletePeer}
        title={t('details.peers.deleteTitle')}
        description={
          pendingDeletePeer
            ? t('details.peers.deleteDescription', { name: pendingDeletePeer.name })
            : undefined
        }
        confirmLabel={peerDeleteSubmitting ? t('shared.deleting') : t('shared.delete')}
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
      throw new Error(i18n.t('details.noEndpoint', { ns: 'vpn', protocol: server.protocol }));
  }
}

function SummaryRows({ server }: { server: VPNServer }) {
  const { t } = useTranslation('vpn');
  return (
    <>
      {server.listenPort ? <Row label={t('shared.port')} value={server.listenPort} ltr /> : null}
      {server.localIp ? <Row label={t('details.localIp')} value={server.localIp} ltr /> : null}
      {server.localIpPool ? (
        <Row label={t('details.localIpPool')} value={server.localIpPool} ltr />
      ) : null}
      {server.remoteIp ? <Row label={t('details.remoteIp')} value={server.remoteIp} ltr /> : null}
      {server.ipPool ? <Row label={t('details.remoteIpPool')} value={server.ipPool} ltr /> : null}
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
  const { t } = useTranslation('vpn');
  switch (details.kind) {
    case 'openvpn': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label={t('shared.name')} value={d.name} />
          <Row label={t('shared.enabled')} value={<BoolBadge value={d.enabled} />} />
          {server.listenPort ? null : <Row label={t('shared.port')} value={d.port} ltr />}
          <Row label={t('shared.protocol')} value={d.protocol} />
          <Row label={t('details.certificate')} value={d.certificate} />
          <Row
            label={t('details.requireClientCert')}
            value={<BoolBadge value={d.requireClientCertificate} />}
          />
          <Row
            label={t('shared.comment')}
            value={d.comment ? <strong>{d.comment}</strong> : '–'}
            wide
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
            <Row label={t('shared.name')} value={d.name} />
            <Row label={t('shared.enabled')} value={<BoolBadge value={!d.disabled} />} />
            <Row label={t('shared.running')} value={<BoolBadge value={d.running} />} />
            {server.listenPort ? null : (
              <Row label={t('shared.listenPort')} value={d.listenPort} ltr />
            )}
            <Row label="MTU" value={d.mtu} />
            <Row label={t('shared.publicKey')} value={<code dir="ltr">{d.publicKey}</code>} wide />
            <Row
              label={t('shared.privateKey')}
              value={<code dir="ltr">{d.privateKey}</code>}
              wide
            />
            {d.comment ? <Row label={t('shared.comment')} value={d.comment} /> : null}
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
          <Row label={t('shared.enabled')} value={<BoolBadge value={d.enabled} />} />
          <Row label={t('details.auth')} value={d.auth} />
          <Row label={t('users.table.profile')} value={d.profile} />
          {server.localIp ? null : (
            <Row label={t('details.localAddress')} value={d.localAddress} ltr />
          )}
          {server.remoteIp ? null : (
            <Row label={t('details.remoteAddress')} value={d.remoteAddress} ltr />
          )}
          <Row label={t('details.dnsServer')} value={d.dnsServer} ltr />
          <Row label={t('details.useCompression')} value={d.useCompression} />
          <Row label={t('details.useEncryption')} value={d.useEncryption} />
          <Row label={t('details.onlyOne')} value={d.onlyOne} />
          <Row label={t('details.changeTcpMss')} value={d.changeTcpMss} />
          <SecretsRow secrets={d.secrets} />
        </DList>
      );
    }
    case 'l2tp': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label={t('shared.enabled')} value={<BoolBadge value={d.enabled} />} />
          <Row label={t('details.auth')} value={d.auth} />
          <Row label={t('users.table.profile')} value={d.profile} />
          <Row label={t('shared.protocol')} value={d.protocol} />
          <Row label="IPsec" value={d.ipsec} />
          <Row
            label={t('shared.ipsecSecret')}
            value={d.ipsecSecret ? <code dir="ltr">{d.ipsecSecret}</code> : '–'}
            wide
          />
          <Row
            label={t('details.oneSessionPerHost')}
            value={<BoolBadge value={d.oneSessionPerHost} />}
          />
          {server.localIp ? null : (
            <Row label={t('details.localAddress')} value={d.localAddress} ltr />
          )}
          {server.remoteIp ? null : (
            <Row label={t('details.remoteAddress')} value={d.remoteAddress} ltr />
          )}
          <Row label={t('details.dnsServer')} value={d.dnsServer} ltr />
          <Row label={t('details.useCompression')} value={d.useCompression} />
          <Row label={t('details.useEncryption')} value={d.useEncryption} />
          <Row label={t('details.onlyOne')} value={d.onlyOne} />
          <Row label={t('details.changeTcpMss')} value={d.changeTcpMss} />
          <SecretsRow secrets={d.secrets} />
        </DList>
      );
    }
    case 'sstp': {
      const d = details.data;
      return (
        <DList>
          <SummaryRows server={server} />
          <Row label={t('shared.enabled')} value={<BoolBadge value={d.enabled} />} />
          {server.listenPort ? null : <Row label={t('shared.port')} value={d.port} ltr />}
          <Row label={t('details.certificate')} value={d.certificate} />
          <Row
            label={t('details.verifyClientCert')}
            value={<BoolBadge value={d.verifyClientCertificate} />}
          />
          <Row label={t('details.tlsVersion')} value={d.tlsVersion} />
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
  const { t } = useTranslation('vpn');
  const format = useFormat();
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
          {t('servers.table.peers')} <Badge tone="info">{format.number(peers.length)}</Badge>
        </strong>
        <Button size="sm" variant="success" disabled={!canMutate} onClick={onAdd}>
          <Plus size={14} aria-hidden /> {t('peers.add')}
        </Button>
      </div>
      {peers.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>{t('details.peers.empty')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'start', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '6px 8px' }}>{t('shared.name')}</th>
                <th style={{ padding: '6px 8px' }}>{t('shared.allowedAddresses')}</th>
                <th style={{ padding: '6px 8px' }}>{t('details.peers.endpoint')}</th>
                <th style={{ padding: '6px 8px' }}>{t('details.peers.lastHandshake')}</th>
                <th style={{ padding: '6px 8px' }}>{t('shared.status')}</th>
                <th style={{ padding: '6px 8px', width: 160 }}>{t('shared.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((p) => (
                <tr key={p.id || p.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '6px 8px' }}>{p.name}</td>
                  <td style={{ padding: '6px 8px' }} dir="ltr">
                    {p.allowedAddresses || '–'}
                  </td>
                  <td style={{ padding: '6px 8px' }} dir="ltr">
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
                            ? t('details.peers.configFor', { name: p.name })
                            : t('details.peers.noPrivateKey')
                        }
                        aria-label={t('details.peers.configForPeer', { name: p.name })}
                        onClick={() => onShowConfig(p)}
                      >
                        <QrCode size={14} aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canMutate}
                        title={t('shared.editNamed', { name: p.name })}
                        aria-label={t('details.peers.editPeer', { name: p.name })}
                        onClick={() => onEdit(p)}
                      >
                        <Pencil size={14} aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!canMutate}
                        title={t('shared.deleteNamed', { name: p.name })}
                        aria-label={t('details.peers.deletePeer', { name: p.name })}
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

function Row({
  label,
  value,
  wide,
  ltr,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  // Machine values (IPs, ports, keys) keep left-to-right order in RTL layouts.
  ltr?: boolean;
}) {
  const empty = value === '' || value === null || value === undefined;
  return (
    <>
      <dt className={styles.detailsLabel}>{label}</dt>
      <dd className={`${styles.detailsValue}${wide ? ` ${styles.detailsValueWide}` : ''}`}>
        {empty ? '–' : ltr ? <span dir="ltr">{value}</span> : value}
      </dd>
    </>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  const { t } = useTranslation('vpn');
  return (
    <Badge tone={value ? 'success' : 'neutral'}>{value ? t('shared.yes') : t('shared.no')}</Badge>
  );
}

function SecretsRow({ secrets }: { secrets: Array<{ username: string; password: string }> }) {
  const { t } = useTranslation('vpn');
  if (!secrets || secrets.length === 0) {
    return <Row label={t('details.secrets')} value="–" wide />;
  }
  return (
    <Row
      label={t('details.secrets')}
      wide
      value={
        <ul style={{ margin: 0, paddingInlineStart: 16 }}>
          {secrets.map((s) => (
            <li key={s.username}>
              <strong>{s.username}</strong> · <code dir="ltr">{s.password}</code>
            </li>
          ))}
        </ul>
      }
    />
  );
}
