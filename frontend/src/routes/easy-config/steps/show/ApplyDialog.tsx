import { Button, Dialog, Inline, Progress } from '@nasnet/ui';
import styles from '../../../EasyConfigWizard.module.scss';
import { SuccessCheck } from './SuccessCheck';
import { ErrorCross } from './ErrorCross';

interface Props {
  open: boolean;
  applying: boolean;
  applied: boolean;
  progress: number;
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
  error,
  managementWifiSsid,
  managementWifiPassword,
  onClose,
  onRetry,
  onDone,
}: Props) {
  const showError = Boolean(error) && !applying && !applied;
  return (
    <Dialog open={open} onClose={onClose} size="sm" labelledBy="apply-dialog-title">
      <div className={styles.applyModal}>
        {applying ? (
          <>
            <div className={styles.spinner} aria-hidden="true" />
            <h2 id="apply-dialog-title" className={styles.applyTitle}>
              Applying configuration…
            </h2>
            <p className={styles.applySubtitle}>
              Running RouterOS commands via the batch executor.
            </p>
            <div className={styles.applyProgress}>
              <Progress value={progress} label="Progress" tone="success" />
            </div>
            <div className={styles.emergencyAlert} role="alert">
              <span aria-hidden="true" className={styles.emergencyAlertIcon}>
                !
              </span>
              <div className={styles.emergencyAlertBody}>
                <p className={styles.emergencyAlertText}>
                  If the connection drops or setup runs into an error, you can still reach the
                  router through the emergency interfaces: plug into the last Ethernet port and open{' '}
                  <strong>192.168.200.1</strong>
                  {managementWifiSsid ? (
                    <>
                      , or join the management WiFi below and open <strong>192.168.210.1</strong>
                    </>
                  ) : (
                    '.'
                  )}
                </p>
                {managementWifiSsid ? (
                  <dl className={styles.emergencyWifi}>
                    <div>
                      <dt>WiFi name</dt>
                      <dd>{managementWifiSsid}</dd>
                    </div>
                    <div>
                      <dt>Password</dt>
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
              Configuration applied successfully
            </h2>
            <p className={styles.applySubtitle}>
              Your router is now running the new configuration.
            </p>
            <Button variant="success" onClick={onDone}>
              Ok
            </Button>
          </>
        ) : showError ? (
          <>
            <ErrorCross />
            <h2 id="apply-dialog-title" className={styles.applyTitle}>
              Apply failed
            </h2>
            <p className={styles.applySubtitle}>{error}</p>
            <Inline>
              <Button variant="ghost" onClick={onRetry}>
                Retry
              </Button>
              <Button variant="success" onClick={onDone}>
                Ok
              </Button>
            </Inline>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
