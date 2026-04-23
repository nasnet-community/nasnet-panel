import { Wifi } from 'lucide-react';
import { Badge, Button, Inline, Switch } from '@nasnet/ui';
import type { Interface, WirelessSettings } from '../../api';
import styles from '../WirelessPage.module.scss';
import { cx, toneClass } from './utils';

interface Props {
  iface: Interface;
  settings: WirelessSettings;
  onToggle: (running: boolean) => void;
  onEdit: (iface: Interface) => void;
}

export function InterfaceRow({ iface, settings, onToggle, onEdit }: Props) {
  return (
    <div className={styles.interfaceRow}>
      <div className={cx(styles.iconTone, toneClass('primary'))}>
        <Wifi size={14} />
      </div>
      <div>
        <strong>{iface.ssid ?? settings.ssid}</strong>{' '}
        <span className={styles.interfaceName}>({iface.name})</span>
        <div>
          <Badge tone={iface.running ? 'success' : 'neutral'}>
            {iface.running ? 'enabled' : 'disabled'}
          </Badge>{' '}
          {(iface.securityTypes && iface.securityTypes.length > 0
            ? iface.securityTypes
            : [settings.security]
          ).map((s) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}{' '}
          <Badge tone="neutral">{(iface.band ?? settings.band).toUpperCase()}</Badge>{' '}
          {settings.countryCode ? <Badge tone="neutral">{settings.countryCode}</Badge> : null}
        </div>
      </div>
      <Inline $gap="12px">
        <Switch
          aria-label={`Enable ${iface.name}`}
          checked={iface.running}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <Button size="sm" variant="secondary" onClick={() => onEdit(iface)}>
          Edit
        </Button>
      </Inline>
    </div>
  );
}
