import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, useToast } from '@nasnet/ui';
import { fetchNasnetVpnCredentials } from '../../../../api';
import { useSession } from '../../../../state/SessionContext';
import { useRouter } from '../../../../state/RouterStoreContext';
import { useFormat } from '../../../../utils/useFormat';
import styles from './HyperSpeedClaimDialog.module.scss';

export interface ClaimedVpnCredentials {
  server: string;
  username: string;
  password: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onClaimed: (creds: ClaimedVpnCredentials) => void;
}

export function HyperSpeedClaimDialog({ open, onClose, onClaimed }: Props) {
  const { t } = useTranslation('easyConfig');
  const format = useFormat();
  const { id: routerId } = useParams<{ id: string }>();
  const { getCredentials } = useSession();
  const router = useRouter(routerId);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // The server's date string is shown as-is when it doesn't parse.
  const displayDate = (value: string) =>
    Number.isNaN(Date.parse(value)) ? value : format.date(value);

  const claim = async () => {
    const creds = routerId ? getCredentials(routerId) : undefined;
    const host = router?.host;
    if (!creds || !host) {
      toast.notify({
        title: t('hyperSpeed.toast.missingTitle'),
        description: t('hyperSpeed.toast.missingDescription'),
        tone: 'danger',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNasnetVpnCredentials({ host, ...creds });
      onClaimed({ server: data.server, username: data.username, password: data.password });
      toast.notify({
        title: t('hyperSpeed.toast.successTitle'),
        description: data.expiryDate
          ? t('hyperSpeed.toast.validUntil', { date: displayDate(data.expiryDate) })
          : undefined,
        tone: 'success',
      });
      onClose();
    } catch (err) {
      const message = (err as Error).message || t('hyperSpeed.toast.fallbackError');
      toast.notify({
        title: t('hyperSpeed.toast.failedTitle'),
        description: message,
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? () => undefined : onClose}
      size="md"
      labelledBy="hyper-speed-title"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t('hyperSpeed.cancel')}
          </Button>
          <Button variant="success" onClick={claim} loading={loading}>
            <Sparkles size={14} strokeWidth={2} /> {t('hyperSpeed.claim')}
          </Button>
        </>
      }
    >
      <div className={styles.promo}>
        <span className={styles.badgeRow}>
          <span className={styles.badge}>{t('hyperSpeed.hotDeal')}</span>
          <span>{t('hyperSpeed.availableNow')}</span>
        </span>
        <h3 id="hyper-speed-title" className={styles.title}>
          {t('hyperSpeed.title')}
        </h3>
        <p className={styles.subtitle}>{t('hyperSpeed.subtitle')}</p>
      </div>
      <div className={styles.body}>
        <ul className={styles.bullets}>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            {t('hyperSpeed.bullets.bandwidth')}
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            {t('hyperSpeed.bullets.throttling')}
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            {t('hyperSpeed.bullets.servers')}
          </li>
          <li className={styles.bullet}>
            <Check size={14} strokeWidth={2.5} className={styles.bulletCheck} />
            {t('hyperSpeed.bullets.autoConfig')}
          </li>
        </ul>
        <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}>
          <Lock size={14} strokeWidth={2} />
          {t('hyperSpeed.validity')}
        </p>
      </div>
    </Dialog>
  );
}
