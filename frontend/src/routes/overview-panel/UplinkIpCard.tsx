import React, { useMemo } from 'react';
import { Globe } from 'lucide-react';
import { Badge, Card, StatusDot } from '@nasnet/ui';
import type { InterfaceResponse, IpAddressResponse } from '../../api';
import { buildUplinks, type UplinkKind } from './uplinks';
import styles from './OverviewPanel.module.scss';

export interface UplinkIpCardProps {
  interfaces: InterfaceResponse[];
  addresses: IpAddressResponse[];
}

const KIND_TONE: Record<UplinkKind, 'info' | 'warning' | 'success' | 'neutral'> = {
  starlink: 'info',
  mobile: 'warning',
  fiber: 'success',
  ether: 'neutral',
};

export const UplinkIpCard: React.FC<UplinkIpCardProps> = React.memo(function UplinkIpCard({
  interfaces,
  addresses,
}) {
  const rows = useMemo(() => buildUplinks(interfaces, addresses), [interfaces, addresses]);

  return (
    <Card className={styles.panelCard} data-testid="uplink-card">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.cardTitleIcon} aria-hidden>
            <Globe size={16} />
          </span>
          Uplink IP Addresses
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={styles.uplinkEmpty}>
          <span className={styles.cardTitleIcon} aria-hidden>
            <Globe size={16} />
          </span>
          <span>No uplink interfaces detected</span>
        </div>
      ) : (
        <div className={styles.uplinkList}>
          {rows.map((row) => (
            <div
              key={row.ifaceName}
              className={styles.uplinkRow}
              data-testid={`uplink-${row.ifaceName}`}
            >
              <StatusDot
                $status={row.disabled ? 'offline' : row.running ? 'online' : 'offline'}
                aria-hidden
              />
              <span className={styles.uplinkName} title={row.ifaceName}>
                {row.label}
              </span>
              <Badge tone={KIND_TONE[row.kind]}>{row.kind}</Badge>
              <span className={styles.uplinkIps}>
                {row.ipAddresses.length > 0 ? (
                  row.ipAddresses.map((ip) => (
                    <span key={ip} className={styles.uplinkIp}>
                      {ip}
                    </span>
                  ))
                ) : (
                  <span className={styles.uplinkIp}>no address</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});
