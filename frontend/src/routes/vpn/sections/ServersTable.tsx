import { useTranslation } from 'react-i18next';
import { Badge, Button, DataTable } from '@nasnet/ui';
import { Download, Pencil, Power, PowerOff, Server as ServerIcon, Trash2 } from 'lucide-react';
import type { VPNServer } from '../../../api';
import { useFormat } from '../../../utils/useFormat';

interface Props {
  rows: VPNServer[];
  totalRows: number;
  onRowClick?: (server: VPNServer) => void;
  onEdit?: (server: VPNServer) => void;
  onDelete?: (server: VPNServer) => void;
  onDisable?: (server: VPNServer) => void;
  onToggleEnabled?: (server: VPNServer) => void;
  onDownloadConfig?: (server: VPNServer) => void;
  canMutate?: boolean;
  peerCounts?: Record<string, number>;
}

const isDeletable = (s: VPNServer) => s.protocol === 'openvpn' || s.protocol === 'wireguard';
const isEditable = (s: VPNServer) => s.protocol === 'wireguard';
const isDisableable = (s: VPNServer) =>
  (s.protocol === 'sstp' || s.protocol === 'l2tp') && s.running;
const isToggleable = (s: VPNServer) => s.protocol === 'openvpn';
const isDownloadable = (s: VPNServer) => s.protocol === 'openvpn';

export function ServersTable({
  rows,
  totalRows,
  onRowClick,
  onEdit,
  onDelete,
  onDisable,
  onToggleEnabled,
  onDownloadConfig,
  canMutate = false,
  peerCounts = {},
}: Props) {
  const { t } = useTranslation('vpn');
  const format = useFormat();
  return (
    <DataTable
      columns={[
        { key: 'name', header: t('shared.name'), render: (s: VPNServer) => s.name },
        {
          key: 'protocol',
          header: t('shared.protocol'),
          render: (s: VPNServer) => <Badge tone="info">{s.protocol.toUpperCase()}</Badge>,
        },
        {
          key: 'status',
          header: t('shared.status'),
          render: (s: VPNServer) => (
            <Badge tone={s.running ? 'success' : 'neutral'}>
              {s.running ? t('shared.running') : t('shared.disabled')}
            </Badge>
          ),
        },
        {
          key: 'port',
          header: t('shared.port'),
          render: (s: VPNServer) => {
            if (!s.listenPort) return '–';
            if (!s.transport) return s.listenPort;
            const transport = s.transport.toLowerCase();
            const tone = transport === 'tcp' ? 'primary' : transport === 'udp' ? 'info' : 'neutral';
            return <Badge tone={tone}>{`${transport}:${s.listenPort}`}</Badge>;
          },
        },
        {
          key: 'peers',
          header: t('servers.table.peers'),
          render: (s: VPNServer) => {
            if (s.protocol !== 'wireguard') return '–';
            const count = peerCounts[s.id];
            if (count === undefined) return '–';
            const label = t('servers.table.peersOn', { count, name: s.name });
            return (
              <Badge tone="neutral" title={label} aria-label={label}>
                {format.number(count)}
              </Badge>
            );
          },
        },
        {
          key: 'actions',
          header: t('shared.actions'),
          render: (s: VPNServer) => {
            const editable = isEditable(s);
            const deletable = isDeletable(s);
            const disableable = isDisableable(s);
            const toggleable = isToggleable(s);
            const downloadable = isDownloadable(s);
            if (!editable && !deletable && !disableable && !toggleable && !downloadable) {
              return null;
            }
            const toggleLabel = s.running
              ? t('shared.disableNamed', { name: s.name })
              : t('shared.enableNamed', { name: s.name });
            return (
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {downloadable && onDownloadConfig ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canMutate}
                    title={t('servers.table.downloadConfig', { name: s.name })}
                    aria-label={t('servers.table.downloadConfig', { name: s.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadConfig(s);
                    }}
                  >
                    <Download size={14} aria-hidden />
                  </Button>
                ) : null}
                {editable && onEdit ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!canMutate}
                    title={t('shared.editNamed', { name: s.name })}
                    aria-label={t('shared.editNamed', { name: s.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(s);
                    }}
                  >
                    <Pencil size={14} aria-hidden />
                  </Button>
                ) : null}
                {toggleable && onToggleEnabled ? (
                  <Button
                    size="sm"
                    variant={s.running ? 'danger' : 'secondary'}
                    disabled={!canMutate}
                    title={toggleLabel}
                    aria-label={toggleLabel}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(s);
                    }}
                  >
                    {s.running ? (
                      <PowerOff size={14} aria-hidden />
                    ) : (
                      <Power size={14} aria-hidden />
                    )}
                  </Button>
                ) : null}
                {deletable && onDelete ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canMutate}
                    title={t('shared.deleteNamed', { name: s.name })}
                    aria-label={t('shared.deleteNamed', { name: s.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(s);
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                  </Button>
                ) : null}
                {disableable && onDisable ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!canMutate}
                    title={t('shared.disableNamed', { name: s.name })}
                    aria-label={t('shared.disableNamed', { name: s.name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDisable(s);
                    }}
                  >
                    <Power size={14} aria-hidden />
                  </Button>
                ) : null}
              </span>
            );
          },
          width: '160px',
        },
      ]}
      rows={rows}
      rowKey={(s) => s.id}
      onRowClick={onRowClick}
      emptyMessage={totalRows ? t('servers.table.noMatch') : t('servers.table.empty')}
      emptyIcon={<ServerIcon size={32} aria-hidden />}
    />
  );
}
