import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  useToast,
} from '@nasnet/ui';
import {
  ApiError,
  fetchDirectForeign,
  fetchNetStatus,
  isDirectForeignActive,
  setDirectForeign,
  type DirectForeignStatus,
  type SystemCredentials,
} from '../../api';
import { usePolling } from '../../utils/usePolling';
import styles from './DirectForeignCard.module.scss';

export interface DirectForeignCardProps {
  creds: SystemCredentials | null;
  onChanged?: () => void;
  openRequest?: number;
}

export function DirectForeignCard({ creds, onChanged, openRequest = 0 }: DirectForeignCardProps) {
  const { t } = useTranslation('internet');
  const toast = useToast();
  const [status, setStatus] = useState<DirectForeignStatus | null>(null);
  const [vpnDown, setVpnDown] = useState(false);
  const [forced, setForced] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!creds) return;
    let failed = false;
    try {
      setStatus(await fetchDirectForeign(creds));
    } catch {
      failed = true;
    }
    try {
      const probes = (await fetchNetStatus(creds)).filter((e) => e.type === 'vpn');
      setVpnDown(probes.some((e) => e.status === 'down'));
    } catch {
      failed = true;
    }
    setLoadFailed(failed);
  }, [creds]);

  const closeDialog = useCallback(() => {
    setConfirming(false);
    setAcknowledged(false);
    setForced(false);
  }, []);

  usePolling(load, 5000, !!creds && !busy && !confirming);

  useEffect(() => {
    if (openRequest > 0) {
      setForced(true);
      setConfirming(true);
    }
    // Only a new request opens the dialog; a later status change must not reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);

  const apply = useCallback(
    async (enabled: boolean) => {
      if (!creds) return;
      setBusy(true);
      try {
        const next = await setDirectForeign(creds, enabled, enabled);
        setStatus(next);
        toast.notify({
          title: t(enabled ? 'internet.direct.enabledToast' : 'internet.direct.disabledToast'),
          tone: enabled ? 'warning' : 'success',
        });
        closeDialog();
        onChanged?.();
      } catch (err) {
        toast.notify({
          title: t('internet.direct.failedTitle'),
          description: err instanceof Error || err instanceof ApiError ? err.message : undefined,
          tone: 'danger',
        });
        await load();
      } finally {
        setBusy(false);
      }
    },
    [creds, toast, t, onChanged, load, closeDialog],
  );

  const risks = useMemo(() => t('internet.direct.risks', { returnObjects: true }) as string[], [t]);

  const enabled = isDirectForeignActive(status);
  if (!status || !(vpnDown || enabled || forced || confirming)) return null;

  const warnNoRoute = !status.foreignRouteReady;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('internet.direct.title')}</CardTitle>
        <CardDescription>{t('internet.direct.description')}</CardDescription>
      </CardHeader>
      <div className={styles.row}>
        <div className={styles.state}>
          <Badge tone={enabled ? 'warning' : 'success'}>
            {t(enabled ? 'internet.direct.stateDirect' : 'internet.direct.stateVpn')}
          </Badge>
          <span>
            {t(enabled ? 'internet.direct.stateDirectHint' : 'internet.direct.stateVpnHint')}
          </span>
          {warnNoRoute ? <Badge tone="danger">{t('internet.direct.noForeignRoute')}</Badge> : null}
        </div>
        {loadFailed ? (
          <div className={styles.state}>
            <Badge tone="danger">{t('internet.direct.loadFailed')}</Badge>
            <Button variant="ghost" size="sm" onClick={() => load()}>
              {t('internet.direct.retry')}
            </Button>
          </div>
        ) : null}
        {enabled ? (
          <Button loading={busy} onClick={() => apply(false)}>
            {t('internet.direct.restore')}
          </Button>
        ) : (
          <Button variant="danger" disabled={busy} onClick={() => setConfirming(true)}>
            {t('internet.direct.enable')}
          </Button>
        )}
      </div>
      <Dialog
        open={confirming}
        onClose={closeDialog}
        title={t('internet.direct.confirmTitle')}
        description={t('internet.direct.confirmDescription')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" disabled={busy} onClick={closeDialog}>
              {t('internet.direct.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={busy}
              disabled={!acknowledged}
              onClick={() => apply(true)}
            >
              {t('internet.direct.confirm')}
            </Button>
          </>
        }
      >
        <ul className={styles.risks}>
          {risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
        <Checkbox
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          label={t('internet.direct.acknowledge')}
        />
      </Dialog>
    </Card>
  );
}
