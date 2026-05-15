import { Tooltip } from '@nasnet/ui';
import styles from './HyperSpeedPromoCard.module.scss';

export function HyperSpeedPromoCard() {
  return (
    <div className={styles.promo}>
      <div className={styles.copy}>
        <span className={styles.badgeRow}>
          <span className={styles.badge}>Hot Deal</span>
          <span>Available now</span>
        </span>
        <h4 className={styles.title}>FREE Hyper Speed VPN powered by NasNet Connect</h4>
        <p className={styles.subtitle}>Optimized for Starlink & built for NasNet Connect users.</p>
      </div>
      <Tooltip label="Coming soon">
        <button type="button" className={styles.cta} disabled aria-label="Claim your free VPN">
          Claim your free VPN
        </button>
      </Tooltip>
    </div>
  );
}
