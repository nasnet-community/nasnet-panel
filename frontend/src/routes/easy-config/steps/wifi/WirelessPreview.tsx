import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './WirelessPreview.module.scss';

export interface WirelessPreviewBand {
  id?: string;
  ssid: string;
  band?: string;
}

interface Props {
  bands: WirelessPreviewBand[];
  enabled: boolean;
}

export function WirelessPreview({ bands, enabled }: Props) {
  const { t } = useTranslation('easyConfig');
  return (
    <div className={styles.wrap} aria-live="polite">
      <div className={`${styles.previews} ${bands.length > 1 ? styles.previewsRow : ''}`}>
        {bands.map((b) => {
          const ssid = b.ssid.trim() || t('wifi.previewPlaceholder');
          const isPlaceholder = !b.ssid.trim();
          const key = b.id ?? b.band ?? 'single';
          return (
            <div key={key} className={styles.preview}>
              <div className={`${styles.iconWrap} ${enabled ? '' : styles.iconWrapMuted}`}>
                {enabled ? (
                  <Wifi size={56} strokeWidth={1.75} />
                ) : (
                  <WifiOff size={56} strokeWidth={1.75} />
                )}
              </div>
              <div className={`${styles.ssid} ${isPlaceholder ? styles.ssidPlaceholder : ''}`}>
                {ssid}
              </div>
              {b.band ? <p className={styles.band}>{b.band}</p> : null}
            </div>
          );
        })}
      </div>
      {/* <p className={styles.caption}>
        {enabled ? 'Broadcasted from your router' : 'Wireless network is disabled'}
      </p> */}
    </div>
  );
}
