import { useTranslation } from 'react-i18next';
import { Tooltip } from '@nasnet/ui';
import styles from './HyperSpeedPromoCard.module.scss';

export function HyperSpeedPromoCard() {
  const { t } = useTranslation('easyConfig');
  return (
    <div className={styles.promo}>
      <div className={styles.copy}>
        <span className={styles.badgeRow}>
          <span className={styles.badge}>{t('hyperSpeed.hotDeal')}</span>
          <span>{t('hyperSpeed.availableNow')}</span>
        </span>
        <h4 className={styles.title}>{t('hyperSpeed.title')}</h4>
        <p className={styles.subtitle}>{t('hyperSpeed.subtitle')}</p>
      </div>
      <Tooltip label={t('hyperSpeed.comingSoon')}>
        <button
          type="button"
          className={styles.cta}
          disabled
          aria-label={t('hyperSpeed.claimYours')}
        >
          {t('hyperSpeed.claimYours')}
        </button>
      </Tooltip>
    </div>
  );
}
