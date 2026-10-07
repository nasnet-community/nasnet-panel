import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppWindow,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Router as RouterIcon,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
  Progress,
  Skeleton,
  Stack,
  useToast,
} from '@nasnet/ui';
import {
  checkAppForUpdates,
  checkForUpdates,
  fetchAppUpdateStatus,
  fetchAppVersion,
  fetchUpdateInfo,
  installAppUpdate,
  installUpdate,
  type AppCheckForUpdatesResponse,
  type UpdateCheckResponse,
  type UpdateInfoResponse,
} from '../api';
import { useRouterStore } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { RouterTabBar } from '../layout/RouterTabBar';
import { useFormat } from '../utils/useFormat';
import styles from './UpdatesPage.module.scss';

const APP_UPDATE_TIMEOUT_MS = 8 * 60 * 1000;

// `step` is a key under updates.progress in the catalog, translated at render.
type ProgressStep = 'starting' | 'preparing' | 'pulling' | 'restarting' | 'waiting' | 'done';

const APP_UPDATE_STEPS: Record<string, { value: number; step: ProgressStep }> = {
  preparing: { value: 15, step: 'preparing' },
  pulling: { value: 55, step: 'pulling' },
  restarting: { value: 85, step: 'restarting' },
};

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function VersionTrackSkeleton() {
  return (
    <div className={styles.versionTrack} aria-busy>
      <div className={styles.versionStop}>
        <Skeleton width={64} height={10} />
        <Skeleton width={96} height={18} style={{ marginTop: 8 }} />
      </div>
      <ArrowRight size={20} aria-hidden className={styles.versionArrow} />
      <div className={styles.versionStop}>
        <Skeleton width={64} height={10} />
        <Skeleton width={96} height={18} style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

function MetaRowSkeleton() {
  return (
    <div className={styles.metaRow} aria-busy>
      <Skeleton width={120} height={26} radius={999} />
      <Skeleton width={90} height={26} radius={999} />
    </div>
  );
}

function RouterOSIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 41.83 44.62" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M11.71,21.59c-.09-.1-.19-.19-.31-.26l-2.95-1.63c-.11-.06-.22-.07-.32-.05-.27-.02-.53.18-.53.48v7.99c0,.72.39,1.39,1.03,1.74l2.7,1.48c.33.18.73-.06.73-.43v-8.58c0-.29-.13-.55-.34-.74Z" />
      <path d="M33.21,14.78l-10.19-5.58-1.31-.72c-.52-.29-1.16-.29-1.69,0l-2.9,1.6c-.1.05-.16.13-.21.22-.17.23-.12.57.15.72l8.62,4.72c.3.22.29.68-.05.87l-3.81,2.11c-.52.29-1.16.29-1.69,0l-8.48-4.69c-.52-.29-1.16-.29-1.69,0l-1.4.77c-.28.16-.51.39-.66.65-.2.31-.32.68-.32,1.06v.52l6.44,3.53,3.73,2.06s.06.05.09.07c.09.06.17.12.25.19.24.23.4.52.5.83.04.14.06.29.06.44v10.66c0,.26.12.49.31.66.07.08.15.14.24.2l.76.42c.59.33,1.31.33,1.91,0l.76-.42c.17-.09.31-.24.39-.41.1-.14.15-.31.15-.49v-10.55c0-.63.34-1.22.9-1.53l4.95-2.73c.32-.18.7.03.75.38v10.57c0,.38.4.62.73.43l2.7-1.48c.64-.35,1.03-1.02,1.03-1.74v-11.61c0-.72-.4-1.39-1.03-1.74Z" />
      <path d="M39.33,9.57L23.3.62c-1.48-.83-3.28-.83-4.76,0L2.5,9.57c-1.54.86-2.5,2.49-2.5,4.26v17.08c0,1.78.97,3.42,2.53,4.28l16.04,8.82c1.46.81,3.24.81,4.7,0l16.04-8.82c1.56-.86,2.53-2.5,2.53-4.28V13.83c0-1.77-.96-3.4-2.5-4.26ZM36.95,32.33l-15.01,8.26c-.64.35-1.41.35-2.05,0l-15.01-8.26c-.68-.37-1.1-1.09-1.1-1.86V14.27c0-.77.42-1.48,1.09-1.86l15.01-8.38c.64-.36,1.43-.36,2.07,0l15.01,8.38c.67.38,1.09,1.09,1.09,1.86v16.2c0,.78-.42,1.49-1.1,1.86Z" />
    </svg>
  );
}

export function UpdatesPage() {
  const { t } = useTranslation('tools');
  return (
    <>
      <RouterTabBar />
      <PageShell>
        <PageHeader>
          <div>
            <PageTitle>{t('updates.title')}</PageTitle>
            <PageSubtitle>{t('updates.subtitle')}</PageSubtitle>
          </div>
        </PageHeader>

        <div className={styles.cardGrid}>
          <AppUpdateCard />
          <FirmwareUpdateCard />
        </div>
      </PageShell>
    </>
  );
}

function AppUpdateCard() {
  const { routers, lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const { activeRouterId, getCredentials } = useSession();
  const targetId = activeRouterId ?? lastConnectedRouterId ?? selectedRouterId ?? null;
  const targetRouter = useMemo(
    () => (targetId ? routers.find((r) => r.id === targetId) : undefined),
    [routers, targetId],
  );
  const creds = targetId ? getCredentials(targetId) : undefined;
  const host = targetRouter?.host;
  const ready = Boolean(targetId && creds && host);

  const [check, setCheck] = useState<AppCheckForUpdatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState<ProgressStep | null>(null);
  const [complete, setComplete] = useState(false);
  const watchingRef = useRef(false);
  const toast = useToast();
  const { t } = useTranslation('tools');
  const format = useFormat();

  useEffect(
    () => () => {
      watchingRef.current = false;
    },
    [],
  );

  const reload = useCallback(async () => {
    if (!creds || !host) {
      setCheck(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setCheck(await checkAppForUpdates({ host, ...creds }));
    } catch (err) {
      setCheck(null);
      setError(err instanceof Error ? err.message : t('updates.checkFailed'));
    } finally {
      setLoading(false);
    }
  }, [host, creds, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const finishWithError = (message: string) => {
    watchingRef.current = false;
    setInstalling(false);
    setProgress(null);
    toast.notify({ title: t('updates.app.failed'), description: message, tone: 'danger' });
  };

  const waitForRestart = (startedAt: number, fromVersion: string) => {
    if (!watchingRef.current || !creds || !host) return;
    setProgress(95);
    setProgressStep('waiting');
    if (Date.now() - startedAt > APP_UPDATE_TIMEOUT_MS) {
      watchingRef.current = false;
      setInstalling(false);
      toast.notify({
        title: t('updates.app.applied'),
        description: t('updates.app.appliedDetail'),
        tone: 'success',
      });
      return;
    }
    void fetchAppVersion({ host, ...creds })
      .then((r) => r.version)
      .catch(() => null)
      .then((version) => {
        if (!watchingRef.current) return;
        if (version && version !== fromVersion) {
          watchingRef.current = false;
          setProgress(100);
          setProgressStep('done');
          setComplete(true);
          setInstalling(false);
          toast.notify({
            title: t('updates.app.complete'),
            description: t('updates.app.reloading'),
            tone: 'success',
          });
          window.setTimeout(() => window.location.reload(), 1200);
          return;
        }
        window.setTimeout(() => waitForRestart(startedAt, fromVersion), 3000);
      });
  };

  const watchUpdate = (startedAt: number, fromVersion: string) => {
    if (!watchingRef.current || !creds || !host) return;
    if (Date.now() - startedAt > APP_UPDATE_TIMEOUT_MS) {
      finishWithError(t('updates.app.timeout'));
      return;
    }
    void fetchAppUpdateStatus({ host, ...creds })
      .catch(() => null)
      .then((status) => {
        if (!watchingRef.current) return;
        if (status?.phase === 'error') {
          finishWithError(status.message || t('updates.app.failed'));
          return;
        }
        if (status && (status.phase === 'done' || status.phase === 'idle')) {
          waitForRestart(startedAt, fromVersion);
          return;
        }
        const step = status ? APP_UPDATE_STEPS[status.phase] : undefined;
        if (step) {
          setProgress(step.value);
          setProgressStep(step.step);
        }
        window.setTimeout(() => watchUpdate(startedAt, fromVersion), 2000);
      });
  };

  const install = async () => {
    setConfirming(false);
    if (!creds || !host) return;
    setInstalling(true);
    setComplete(false);
    setProgress(5);
    setProgressStep('starting');
    try {
      const result = await installAppUpdate({ host, ...creds });
      if (!result.updateAvailable) {
        setInstalling(false);
        setProgress(null);
        toast.notify({ title: t('updates.app.alreadyUpToDate'), tone: 'success' });
        await reload();
        return;
      }
      watchingRef.current = true;
      watchUpdate(Date.now(), result.fromVersion);
    } catch (err) {
      setInstalling(false);
      setProgress(null);
      toast.notify({
        title: t('updates.app.failed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    }
  };

  const releaseDate =
    check?.releaseDate && isValidDate(check.releaseDate)
      ? format.date(check.releaseDate, { year: 'numeric', month: 'short', day: 'numeric' })
      : null;

  return (
    <Card>
      <Stack>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <AppWindow size={18} aria-hidden />
              </span>
              <h3 style={{ margin: 0 }}>{t('updates.app.title')}</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              {!check
                ? t('updates.app.keepUpToDate')
                : check.updateAvailable
                  ? t('updates.app.newerAvailable')
                  : t('updates.app.runningLatest')}
            </p>
          </div>
          {check ? (
            <span className={styles.badgeRow}>
              <Badge tone={check.updateAvailable ? 'warning' : 'success'}>
                {check.updateAvailable ? null : (
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden
                    style={{ marginInlineEnd: 4, verticalAlign: '-2px' }}
                  />
                )}
                {check.updateAvailable ? t('updates.updateAvailable') : t('updates.upToDate')}
              </Badge>
            </span>
          ) : null}
        </div>

        {!ready ? (
          <p className={styles.emptyNote}>{t('updates.app.connectFirst')}</p>
        ) : (
          <>
            {loading && !check ? (
              <>
                <MetaRowSkeleton />
                <VersionTrackSkeleton />
              </>
            ) : null}

            {error ? <p className={styles.emptyNote}>{error}</p> : null}

            {check ? (
              <>
                <div className={styles.metaRow}>
                  <div className={styles.metaPill}>
                    <Tag size={14} aria-hidden />
                    <span>{check.appVersion}</span>
                  </div>
                  {releaseDate ? (
                    <div className={styles.metaPill}>
                      <CalendarClock size={14} aria-hidden />
                      <span>{releaseDate}</span>
                    </div>
                  ) : null}
                  {check.releaseUrl ? (
                    <a
                      className={`${styles.metaPill} ${styles.metaPillLink}`}
                      href={check.releaseUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} aria-hidden className="rtl-flip" />
                      <span>{t('updates.app.releaseNotes')}</span>
                    </a>
                  ) : null}
                </div>

                {check.updateAvailable ? (
                  <div className={styles.versionTrack}>
                    <div className={styles.versionStop}>
                      <span className={styles.versionStopLabel}>
                        <Tag size={12} aria-hidden /> {t('updates.current')}
                      </span>
                      <span className={styles.versionStopValue} data-testid="app-current-version">
                        {check.appVersion}
                      </span>
                    </div>
                    <ArrowRight
                      size={20}
                      aria-hidden
                      className={`${styles.versionArrow} ${styles.versionArrowActive}`}
                    />
                    <div className={`${styles.versionStop} ${styles.versionStopHighlight}`}>
                      <span className={styles.versionStopLabel}>
                        <Sparkles size={12} aria-hidden /> {t('updates.latest')}
                      </span>
                      <span className={styles.versionStopValue} data-testid="app-latest-version">
                        {check.latestVersion}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.upToDate}>
                    <CheckCircle2 size={22} aria-hidden className={styles.upToDateIcon} />
                    <div className={styles.upToDateBody}>
                      <span className={styles.versionStopLabel}>
                        <Tag size={12} aria-hidden /> {t('updates.current')}
                      </span>
                      <span className={styles.versionStopValue} data-testid="app-current-version">
                        {check.appVersion}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {progress !== null ? (
              <Progress
                value={progress}
                label={progressStep ? t(`updates.progress.${progressStep}`) : ''}
              />
            ) : null}

            {check?.updateAvailable ? (
              <div className={styles.actions}>
                <Button variant="success" onClick={() => setConfirming(true)} disabled={installing}>
                  {installing ? (
                    <>
                      <Loader2 size={14} aria-hidden /> {t('updates.installing')}
                    </>
                  ) : complete ? (
                    <>
                      <CheckCircle2 size={14} aria-hidden /> {t('updates.done')}
                    </>
                  ) : (
                    <>
                      <Download size={14} aria-hidden /> {t('updates.app.updateButton')}
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Stack>

      <ConfirmDialog
        open={confirming}
        title={t('updates.app.confirmTitle')}
        description={t('updates.app.confirmDescription')}
        confirmLabel={t('updates.confirm')}
        confirmVariant="success"
        onConfirm={install}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}

function FirmwareUpdateCard() {
  const { routers, lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const { activeRouterId, getCredentials } = useSession();
  const targetId = activeRouterId ?? lastConnectedRouterId ?? selectedRouterId ?? null;
  const targetRouter = useMemo(
    () => (targetId ? routers.find((r) => r.id === targetId) : undefined),
    [routers, targetId],
  );
  const creds = targetId ? getCredentials(targetId) : undefined;
  const host = targetRouter?.host;
  const ready = Boolean(targetId && creds && host);

  const [check, setCheck] = useState<UpdateCheckResponse | null>(null);
  const [meta, setMeta] = useState<UpdateInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [complete, setComplete] = useState(false);
  const toast = useToast();
  const { t } = useTranslation('tools');

  const reload = useCallback(async () => {
    if (!creds || !host) {
      setCheck(null);
      setMeta(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [c, m] = await Promise.all([
        checkForUpdates({ host, ...creds }),
        fetchUpdateInfo({ host, ...creds }).catch(() => null),
      ]);
      setCheck(c);
      setMeta(m);
      setComplete(false);
    } catch (err) {
      setCheck(null);
      setMeta(null);
      setError(err instanceof Error ? err.message : t('updates.checkFailed'));
    } finally {
      setLoading(false);
    }
  }, [host, creds, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!creds || !host) {
        setCheck(null);
        setMeta(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [c, m] = await Promise.all([
          checkForUpdates({ host, ...creds }),
          fetchUpdateInfo({ host, ...creds }).catch(() => null),
        ]);
        if (cancelled) return;
        setCheck(c);
        setMeta(m);
        setComplete(false);
      } catch (err) {
        if (cancelled) return;
        setCheck(null);
        setMeta(null);
        setError(err instanceof Error ? err.message : t('updates.checkFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [host, creds, t]);

  const install = async () => {
    setConfirming(false);
    if (!creds || !host) return;
    setInstalling(true);
    setComplete(false);
    try {
      const result = await installUpdate({ host, ...creds });
      setComplete(true);
      if (result.success) {
        toast.notify({
          title: t('updates.firmware.started'),
          description: result.message || t('updates.firmware.startedDetail'),
          tone: 'success',
        });
      } else {
        toast.notify({
          title: t('updates.firmware.failed'),
          description: result.message,
          tone: 'danger',
        });
      }
      await reload();
    } catch (err) {
      toast.notify({
        title: t('updates.firmware.failed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setInstalling(false);
    }
  };

  const channel = meta?.channel || check?.channel;
  const downloaded = /^downloaded/i.test(check?.status ?? '');

  return (
    <Card>
      <Stack>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <RouterOSIcon size={18} />
              </span>
              <h3 style={{ margin: 0 }}>{t('updates.firmware.title')}</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              {targetRouter
                ? t('updates.firmware.installOn', { name: targetRouter.name })
                : t('updates.firmware.connect')}
            </p>
          </div>
          {check ? (
            <span className={styles.badgeRow}>
              <Badge tone={check.updateAvailable ? 'warning' : 'success'}>
                {check.updateAvailable ? null : (
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden
                    style={{ marginInlineEnd: 4, verticalAlign: '-2px' }}
                  />
                )}
                {check.updateAvailable ? t('updates.updateAvailable') : t('updates.upToDate')}
              </Badge>
            </span>
          ) : null}
        </div>

        {!ready ? (
          <p className={styles.emptyNote}>{t('updates.firmware.connectFirst')}</p>
        ) : (
          <>
            {loading && !check ? (
              <>
                <MetaRowSkeleton />
                <VersionTrackSkeleton />
              </>
            ) : null}

            {error ? <p className={styles.emptyNote}>{error}</p> : null}

            {check ? (
              <>
                <div className={styles.metaRow}>
                  <div className={styles.metaPill}>
                    <RouterIcon size={14} aria-hidden />
                    <span>{targetRouter?.name ?? '—'}</span>
                  </div>
                  <div className={styles.metaPill}>
                    <RouterIcon size={14} aria-hidden />
                    <span>{channel || '—'}</span>
                  </div>
                  {meta?.scheduledTime ? (
                    <div className={styles.metaPill}>
                      <CalendarClock size={14} aria-hidden />
                      <span>{meta.scheduledTime}</span>
                    </div>
                  ) : null}
                </div>

                {check.updateAvailable ? (
                  <div className={styles.versionTrack}>
                    <div className={styles.versionStop}>
                      <span className={styles.versionStopLabel}>
                        <Tag size={12} aria-hidden /> {t('updates.current')}
                      </span>
                      <span className={styles.versionStopValue}>
                        {check.installedVersion || '—'}
                      </span>
                    </div>
                    <ArrowRight
                      size={20}
                      aria-hidden
                      className={`${styles.versionArrow} ${styles.versionArrowActive}`}
                    />
                    <div className={`${styles.versionStop} ${styles.versionStopHighlight}`}>
                      <span className={styles.versionStopLabel}>
                        <Sparkles size={12} aria-hidden /> {t('updates.latest')}
                      </span>
                      <span className={styles.versionStopValue}>{check.latestVersion || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.upToDate}>
                    <CheckCircle2 size={22} aria-hidden className={styles.upToDateIcon} />
                    <div className={styles.upToDateBody}>
                      <span className={styles.versionStopLabel}>
                        <Tag size={12} aria-hidden /> {t('updates.current')}
                      </span>
                      <span className={styles.versionStopValue}>
                        {check.installedVersion || '—'}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {check?.updateAvailable || downloaded ? (
              <div className={styles.actions}>
                <Button
                  variant="success"
                  onClick={() => setConfirming(true)}
                  disabled={installing || downloaded}
                >
                  {installing ? (
                    <>
                      <Loader2 size={14} aria-hidden /> {t('updates.installing')}
                    </>
                  ) : complete || downloaded ? (
                    <>
                      <CheckCircle2 size={14} aria-hidden /> {t('updates.done')}
                    </>
                  ) : (
                    <>
                      <Download size={14} aria-hidden /> {t('updates.firmware.updateButton')}
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Stack>

      <ConfirmDialog
        open={confirming}
        title={t('updates.firmware.confirmTitle')}
        description={t('updates.firmware.confirmDescription')}
        destructive
        confirmLabel={t('updates.confirm')}
        onConfirm={install}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
