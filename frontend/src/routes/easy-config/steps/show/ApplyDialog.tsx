import { Trans, useTranslation } from 'react-i18next';
import { Button, Dialog, Inline, Progress } from '@nasnet/ui';
import styles from '../../../EasyConfigWizard.module.scss';
import { SuccessCheck } from './SuccessCheck';
import { ErrorCross } from './ErrorCross';

interface Props {
  open: boolean;
  applying: boolean;
  applied: boolean;
  progress: number;
  stage?: string;
  error: string | null;
  managementWifiSsid: string;
  managementWifiPassword: string;
  onClose: () => void;
  onRetry: () => void;
  onDone: () => void;
}

export function ApplyDialog({
  open,
  applying,
  applied,
  progress,
  stage,
  error,
  managementWifiSsid,
  managementWifiPassword,
  onClose,
  onRetry,
  onDone,
}: Props) {
  const { t } = useTranslation('easyConfig');
  const showError = Boolean(error) && !applying && !applied;
  return (
    <Dialog open={open} onClose={onClose} size="sm" labelledBy="apply-dialog-title">
      <div className={styles.applyModal}>
        {applying ? (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <h2 id="apply-dialog-title" className={styles.applyTitle}>
              {t('apply.applyingTitle')}
            </h2>
            <p className={styles.applySubtitle} aria-live="polite">
              {stage || t('apply.applyingSubtitle')}
            </p>
            <div className={styles.applyProgress}>
              <Progress value={progress} label={t('apply.progress')} tone="success" />
            </div>
            <div className={styles.emergencyAlert} role="alert">
              <span aria-hidden="true" className={styles.emergencyAlertIcon}>
                !
              </span>
              <div className={styles.emergencyAlertBody}>
                <p className={styles.emergencyAlertText}>
                  <Trans
                    t={t}
                    i18nKey={managementWifiSsid ? 'apply.emergencyWithWifi' : 'apply.emergency'}
                    values={{ ip: '192.168.200.1', wifiIp: '192.168.210.1' }}
                    components={{ strong: <strong /> }}
                  />
                </p>
                {managementWifiSsid ? (
                  <dl className={styles.emergencyWifi}>
                    <div>
                      <dt>{t('apply.wifiName')}</dt>
                      <dd>{managementWifiSsid}</dd>
                    </div>
                    <div>
                      <dt>{t('apply.password')}</dt>
                      <dd>{managementWifiPassword}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            </div>
          </>
        ) : applied ? (
          <>
            <SuccessCheck />
            <h2 id="apply-dialog-title" className={styles.applyTitle}>
              {t('apply.successTitle')}
            </h2>
            <p className={styles.applySubtitle}>{t('apply.successSubtitle')}</p>
            <Button variant="success" onClick={onDone}>
              {t('apply.ok')}
            </Button>
          </>
        ) : showError ? (
          <>
            <ErrorCross />
            <h2 id="apply-dialog-title" className={styles.applyTitle}>
              {t('apply.failedTitle')}
            </h2>
            <p className={styles.applySubtitle}>{error}</p>
            <Inline>
              <Button variant="ghost" onClick={onRetry}>
                {t('apply.retry')}
              </Button>
              <Button variant="success" onClick={onDone}>
                {t('apply.ok')}
              </Button>
            </Inline>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
