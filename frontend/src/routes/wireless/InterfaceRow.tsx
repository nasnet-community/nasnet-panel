import { Trash2, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Inline, Switch } from '@nasnet/ui';
import type { Interface, WirelessSettings } from '../../api';
import styles from '../WirelessPage.module.scss';
import { cx, toneClass } from './utils';

interface Props {
  iface: Interface;
  settings: WirelessSettings;
  onToggle: (running: boolean) => void;
  onEdit: (iface: Interface) => void;
  onDelete: (iface: Interface) => void;
}

// RouterOS mode names (AP, Station Bridge…) are shown as-is in every language.
const formatMode = (mode: string): string =>
  mode
    .split('-')
    .map((part) =>
      part.toLowerCase() === 'ap' ? 'AP' : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');

const isStationMode = (mode: string): boolean => mode.toLowerCase().startsWith('station');

export function InterfaceRow({ iface, settings, onToggle, onEdit, onDelete }: Props) {
  const { t } = useTranslation('wireless');
  const enabled = !iface.disabled;
  const station = iface.mode ? isStationMode(iface.mode) : false;
  return (
    <div className={styles.interfaceRow}>
      <div className={cx(styles.iconTone, toneClass('primary'))}>
        <Wifi size={14} />
      </div>
      <div>
        <strong dir="auto">{iface.ssid ?? settings.ssid}</strong>{' '}
        <span className={styles.interfaceName}>
          (<bdi>{iface.name}</bdi>)
        </span>
        {iface.mode ? (
          <>
            {' '}
            <Badge className={station ? styles.stationBadge : styles.modeBadge}>
              {formatMode(iface.mode)}
            </Badge>
          </>
        ) : null}
        {iface.isVirtual ? (
          <>
            {' '}
            <Badge tone="neutral">{t('interfaces.virtual')}</Badge>
          </>
        ) : null}
        <div>
          {enabled ? (
            iface.running ? (
              <Badge tone="success">{t('interfaces.active')}</Badge>
            ) : (
              <Badge tone="primary">{t('interfaces.idle')}</Badge>
            )
          ) : null}{' '}
          {(iface.securityTypes && iface.securityTypes.length > 0
            ? iface.securityTypes
            : settings.securityTypes
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
          aria-label={t('interfaces.enableAria', { name: iface.name })}
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <Button size="sm" variant="secondary" onClick={() => onEdit(iface)}>
          {t('interfaces.edit')}
        </Button>
        {iface.isVirtual ? (
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(iface)}
            aria-label={t('interfaces.deleteAria', { name: iface.name })}
            title={t('interfaces.delete')}
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        ) : null}
      </Inline>
    </div>
  );
}
