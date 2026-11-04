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
  RefreshCw,
  Router as RouterIcon,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
  Progress,
  Select,
  Skeleton,
  Stack,
  useToast,
} from '@nasnet/ui';
import {
  checkForUpdates,
  fetchAppReleases,
  fetchAppUpdateChannel,
  fetchAppUpdateProgress,
  fetchAppVersion,
  fetchUpdateInfo,
  installUpdate,
  fetchSystemUpdateStatus,
  startAppUpdate,
  type AppRelease,
  type AppUpdateChannel,
  type UpdateCheckResponse,
  type SystemUpdateStatusResponse,
  type UpdateInfoResponse,
} from '../api';
import { useRouterStore } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { RouterTabBar } from '../layout/RouterTabBar';
import { useFormat } from '../utils/useFormat';
import { NewsletterCard } from './NewsletterCard';
import styles from './UpdatesPage.module.scss';

// The panel pulls the new image, restarts, and may then reconfigure the router.
const APP_UPDATE_TIMEOUT_MS = 15 * 60 * 1000;
const APP_POLL_MS = 2000;

const APP_CHANNELS: AppUpdateChannel[] = ['stable', 'rc', 'dev'];

// `step` is a key under updates.progress in the catalog, translated at render.
type ProgressStep =
  'starting' | 'preparing' | 'pulling' | 'restarting' | 'waiting' | 'reconfiguring' | 'done';

const APP_UPDATE_STEPS: Record<string, { value: number; step: ProgressStep }> = {
  preparing: { value: 15, step: 'preparing' },
  pulling: { value: 45, step: 'pulling' },
  restarting: { value: 65, step: 'restarting' },
};

/** The leading X.Y.Z of a version or tag (`v1.3.0-rc.1` gives 1.3.0), or null when it has none. */
function versionParts(value: string | undefined | null): number[] | null {
  const match = /^v?(\d+)\.(\d+)(?:\.(\d+))?/.exec(value?.trim() ?? '');
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : null;
}

function isOlder(version: number[], than: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if (version[i] !== than[i]) return version[i] < than[i];
  }
  return false;
}

// The backend gives up after 15 minutes; wait a little longer before giving up here.
const FIRMWARE_UPDATE_TIMEOUT_MS = 16 * 60 * 1000;
const FIRMWARE_POLL_MS = 2000;

// `step` is a key under updates.progress in the catalog, translated at render.
type FirmwareStep = 'starting' | 'downloadingFirmware' | 'rebootingRouter' | 'done';

interface FirmwareProgress {
  value: number;
  step: FirmwareStep;
  /** Download percentage, when RouterOS reports one in its status text. */
  percent?: number;
}

function firmwareProgress(status: SystemUpdateStatusResponse): FirmwareProgress | null {
  if (status.phase === 'downloading') {
    const match = /(\d{1,3})\s*%/.exec(status.message ?? '');
    const percent = match ? Math.min(100, Number(match[1])) : undefined;
    // The download fills 10–70% of the bar; the reboot takes the rest.
    return {
      value: percent === undefined ? 25 : 10 + Math.round(percent * 0.6),
      step: 'downloadingFirmware',
      percent,
    };
  }
  if (status.phase === 'rebooting') return { value: 80, step: 'rebootingRouter' };
  if (status.phase === 'done') return { value: 100, step: 'done' };
  return null;
}

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
          <NewsletterCard />
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

  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [routerosVersion, setRouterosVersion] = useState<string | null>(null);
  const [channel, setChannel] = useState<AppUpdateChannel | null>(null);
  const [releases, setReleases] = useState<AppRelease[] | null>(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState<ProgressStep | null>(null);
  const [reconfigStep, setReconfigStep] = useState('');
  const [complete, setComplete] = useState(false);
  const watchingRef = useRef(false);
  const releasesRequestRef = useRef(0);
  const runningVersionRef = useRef<string | null>(null);
  const toast = useToast();
  const { t } = useTranslation('tools');
  const format = useFormat();

  useEffect(
    () => () => {
      watchingRef.current = false;
    },
    [],
  );

  const loadReleases = useCallback(
    async (next: AppUpdateChannel) => {
      if (!creds || !host) return;
      // Only the latest request may fill the list, so a slow answer for an earlier channel is dropped.
      const request = ++releasesRequestRef.current;
      setLoading(true);
      setError(null);
      // Drop the previous channel's list so none of its releases can be installed meanwhile.
      setReleases(null);
      setSelectedTag('');
      try {
        // The list keeps the running release, which would only answer "already up to date".
        const list = (await fetchAppReleases({ host, ...creds }, next)).filter(
          (r) => r.tag !== runningVersionRef.current,
        );
        if (request !== releasesRequestRef.current) return;
        setReleases(list);
        setSelectedTag(list[0]?.tag ?? '');
      } catch (err) {
        if (request !== releasesRequestRef.current) return;
        setError(err instanceof Error ? err.message : t('updates.checkFailed'));
      } finally {
        if (request === releasesRequestRef.current) setLoading(false);
      }
    },
    [host, creds, t],
  );

  useEffect(() => {
    if (!creds || !host) {
      setReleases(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [version, saved, info] = await Promise.all([
        fetchAppVersion({ host, ...creds })
          .then((r) => r.version)
          .catch(() => null),
        fetchAppUpdateChannel({ host, ...creds }).catch((): AppUpdateChannel => 'stable'),
        fetchUpdateInfo({ host, ...creds }).catch(() => null),
      ]);
      if (cancelled) return;
      runningVersionRef.current = version;
      setAppVersion(version);
      setRouterosVersion(info?.version ?? null);
      setChannel(saved);
      await loadReleases(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [host, creds, loadReleases]);

  const selected = releases?.find((r) => r.tag === selectedTag) ?? null;

  // Why the selected release can't be installed on this router, or null when it can.
  const blockedReason = (() => {
    if (!selected) return null;
    const running = versionParts(appVersion);
    const minApp = versionParts(selected.minAppVersion);
    if (running && minApp && isOlder(running, minApp)) {
      return t('updates.app.needsApp', { version: `v${minApp.join('.')}` });
    }
    const routeros = versionParts(routerosVersion);
    const minRouteros = versionParts(selected.minRouterosVersion);
    if (routeros && minRouteros && isOlder(routeros, minRouteros)) {
      return t('updates.app.needsRouterOS', { version: selected.minRouterosVersion });
    }
    return null;
  })();

  const finishWithError = (message: string) => {
    watchingRef.current = false;
    setInstalling(false);
    setProgress(null);
    toast.notify({ title: t('updates.app.failed'), description: message, tone: 'danger' });
  };

  const finish = () => {
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
  };

  const watchUpdate = (startedAt: number, toVersion: string, expectReconfig: boolean) => {
    if (!watchingRef.current || !creds || !host) return;
    const again = () =>
      window.setTimeout(() => watchUpdate(startedAt, toVersion, expectReconfig), APP_POLL_MS);
    if (Date.now() - startedAt > APP_UPDATE_TIMEOUT_MS) {
      finishWithError(t('updates.app.timeout'));
      return;
    }
    void fetchAppUpdateProgress({ host, ...creds })
      .catch(() => null)
      .then(async (status) => {
        if (!watchingRef.current) return;
        // No answer: the panel is restarting.
        if (!status) {
          setProgress(70);
          setProgressStep('waiting');
          again();
          return;
        }
        if (status.phase === 'error') {
          finishWithError(status.message || t('updates.app.failed'));
          return;
        }
        const reconfig = status.reconfig;
        if (reconfig?.state === 'running') {
          setProgress(75 + Math.round((reconfig.progress / 100) * 24));
          setProgressStep('reconfiguring');
          setReconfigStep(reconfig.step);
          again();
          return;
        }
        if (reconfig?.state === 'failed') {
          watchingRef.current = false;
          setInstalling(false);
          setProgress(null);
          setComplete(true);
          toast.notify({
            title: t('updates.app.reconfigFailed'),
            description: reconfig.error,
            tone: 'danger',
          });
          return;
        }
        if (reconfig?.state === 'completed') {
          finish();
          return;
        }
        const step = APP_UPDATE_STEPS[status.phase];
        if (step) {
          setProgress(step.value);
          setProgressStep(step.step);
          again();
          return;
        }
        // The update is applied. Wait for the new version, and for the reconfiguration it starts.
        if (expectReconfig && reconfig?.state === 'pending') {
          setProgress(70);
          setProgressStep('waiting');
          again();
          return;
        }
        const running = await fetchAppVersion({ host, ...creds })
          .then((r) => r.version)
          .catch(() => null);
        if (!watchingRef.current) return;
        if (running === toVersion) {
          finish();
          return;
        }
        setProgress(70);
        setProgressStep('waiting');
        again();
      });
  };

  const install = async () => {
    setConfirming(false);
    if (!creds || !host || !selected) return;
    const target = selected;
    setInstalling(true);
    setComplete(false);
    setProgress(5);
    setProgressStep('starting');
    try {
      const result = await startAppUpdate({ host, ...creds }, target.tag);
      if (!result.updateAvailable) {
        setInstalling(false);
        setProgress(null);
        toast.notify({ title: t('updates.app.alreadyUpToDate'), tone: 'success' });
        if (channel) await loadReleases(channel);
        return;
      }
      watchingRef.current = true;
      watchUpdate(Date.now(), result.toVersion ?? target.tag, target.autoReconfigable);
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
    selected?.releaseDate && isValidDate(selected.releaseDate)
      ? format.date(selected.releaseDate, { year: 'numeric', month: 'short', day: 'numeric' })
      : null;
  const updateAvailable = !!releases?.length;

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
              {!releases
                ? t('updates.app.keepUpToDate')
                : updateAvailable
                  ? t('updates.app.newerAvailable')
                  : t('updates.app.runningLatest')}
            </p>
          </div>
          {releases ? (
            <span className={styles.badgeRow}>
              <Badge tone={updateAvailable ? 'warning' : 'success'}>
                {updateAvailable ? null : (
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden
                    style={{ marginInlineEnd: 4, verticalAlign: '-2px' }}
                  />
                )}
                {updateAvailable ? t('updates.updateAvailable') : t('updates.upToDate')}
              </Badge>
            </span>
          ) : null}
        </div>

        {!ready ? (
          <p className={styles.emptyNote}>{t('updates.app.connectFirst')}</p>
        ) : (
          <>
            <div className={styles.metaRow}>
              {appVersion ? (
                <div className={styles.metaPill}>
                  <Tag size={14} aria-hidden />
                  <span>{appVersion}</span>
                </div>
              ) : null}
              <div className={styles.channelField}>
                <Select
                  aria-label={t('updates.app.channel')}
                  value={channel ?? ''}
                  onChange={(value) => {
                    const next = value as AppUpdateChannel;
                    setChannel(next);
                    void loadReleases(next);
                  }}
                  options={APP_CHANNELS.map((c) => ({
                    value: c,
                    label: t(`updates.app.channels.${c}`),
                  }))}
                  disabled={!channel || installing}
                />
              </div>
            </div>

            {loading ? (
              <>
                <MetaRowSkeleton />
                <VersionTrackSkeleton />
              </>
            ) : null}

            {error ? (
              <EmptyState
                title={t('updates.app.loadFailed')}
                description={error}
                actions={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (channel) void loadReleases(channel);
                    }}
                    disabled={!channel}
                  >
                    <RefreshCw size={14} aria-hidden /> {t('updates.app.retry')}
                  </Button>
                }
              />
            ) : null}

            {releases && !releases.length ? (
              <div className={styles.upToDate}>
                <CheckCircle2 size={22} aria-hidden className={styles.upToDateIcon} />
                <div className={styles.upToDateBody}>
                  <span className={styles.versionStopLabel}>
                    <Tag size={12} aria-hidden /> {t('updates.current')}
                  </span>
                  <span className={styles.versionStopValue} data-testid="app-current-version">
                    {appVersion ?? '—'}
                  </span>
                  <span className={styles.channelNote}>
                    {t('updates.app.latestInChannel', {
                      channel: channel ? t(`updates.app.channels.${channel}`) : '',
                    })}
                  </span>
                </div>
              </div>
            ) : null}

            {releases?.length && selected ? (
              <>
                <div className={styles.versionTrack}>
                  <div className={styles.versionStop}>
                    <span className={styles.versionStopLabel}>
                      <Tag size={12} aria-hidden /> {t('updates.current')}
                    </span>
                    <span className={styles.versionStopValue} data-testid="app-current-version">
                      {appVersion ?? '—'}
                    </span>
                  </div>
                  <ArrowRight
                    size={20}
                    aria-hidden
                    className={`${styles.versionArrow} ${styles.versionArrowActive}`}
                  />
                  <div className={`${styles.versionStop} ${styles.versionStopHighlight}`}>
                    <span className={styles.versionStopLabel}>
                      <Sparkles size={12} aria-hidden /> {t('updates.app.version')}
                    </span>
                    <Select
                      aria-label={t('updates.app.version')}
                      value={selectedTag}
                      onChange={setSelectedTag}
                      options={releases.map((r) => ({ value: r.tag, label: r.tag }))}
                      disabled={installing}
                    />
                  </div>
                </div>

                <div className={styles.metaRow}>
                  {releaseDate ? (
                    <div className={styles.metaPill}>
                      <CalendarClock size={14} aria-hidden />
                      <span>{releaseDate}</span>
                    </div>
                  ) : null}
                  {selected.prerelease ? (
                    <Badge tone="info">{t('updates.app.prerelease')}</Badge>
                  ) : null}
                  {selected.releaseUrl ? (
                    <a
                      className={`${styles.metaPill} ${styles.metaPillLink}`}
                      href={selected.releaseUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} aria-hidden className="rtl-flip" />
                      <span>{t('updates.app.releaseNotes')}</span>
                    </a>
                  ) : null}
                </div>

                <div className={styles.changelog}>
                  <span className={styles.versionStopLabel}>{t('updates.app.changelog')}</span>
                  {selected.changelog.length ? (
                    <ul>
                      {selected.changelog.map((line, i) => (
                        // Lines can repeat between releases, so the index keeps keys unique.
                        // eslint-disable-next-line react/no-array-index-key
                        <li key={`${selected.tag}-${i}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyNote}>{t('updates.app.noChangelog')}</p>
                  )}
                </div>

                {blockedReason ? (
                  <p className={styles.blockedNote} role="note">
                    {blockedReason}
                  </p>
                ) : null}
              </>
            ) : null}

            {progress !== null ? (
              <Progress
                value={progress}
                label={
                  progressStep === 'reconfiguring' && reconfigStep
                    ? t('updates.progress.reconfiguringStep', { step: reconfigStep })
                    : progressStep
                      ? t(`updates.progress.${progressStep}`)
                      : ''
                }
                tone="success"
              />
            ) : null}

            {selected ? (
              <div className={styles.actions}>
                <Button
                  variant="success"
                  onClick={() => setConfirming(true)}
                  disabled={installing || complete || !!blockedReason}
                >
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
                      <Download size={14} aria-hidden />{' '}
                      {t('updates.app.updateTo', { version: selected.tag })}
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
        description={
          selected?.autoReconfigable
            ? t('updates.app.confirmDescriptionReconfig', { version: selected.tag })
            : t('updates.app.confirmDescriptionVersion', { version: selected?.tag ?? '' })
        }
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
  const [progress, setProgress] = useState<FirmwareProgress | null>(null);
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

  const stopWatching = () => {
    watchingRef.current = false;
    setInstalling(false);
  };

  const watchUpdate = (startedAt: number) => {
    if (!watchingRef.current || !creds || !host) return;
    if (Date.now() - startedAt > FIRMWARE_UPDATE_TIMEOUT_MS) {
      stopWatching();
      setProgress(null);
      toast.notify({
        title: t('updates.firmware.failed'),
        description: t('updates.firmware.timeout'),
        tone: 'danger',
      });
      return;
    }
    void fetchSystemUpdateStatus({ host, ...creds })
      .catch(() => null)
      .then((status) => {
        if (!watchingRef.current) return;
        if (status?.phase === 'error') {
          stopWatching();
          setProgress(null);
          toast.notify({
            title: t('updates.firmware.failed'),
            description: status.message,
            tone: 'danger',
          });
          return;
        }
        if (status?.phase === 'done') {
          stopWatching();
          setProgress({ value: 100, step: 'done' });
          setComplete(true);
          toast.notify({
            title: t('updates.firmware.updated', { version: status.toVersion ?? '' }),
            tone: 'success',
          });
          void reload();
          return;
        }
        const next = status ? firmwareProgress(status) : null;
        if (next) setProgress(next);
        window.setTimeout(() => watchUpdate(startedAt), FIRMWARE_POLL_MS);
      });
  };

  // Pick up an update that is already running, for example after a page reload.
  useEffect(() => {
    if (!creds || !host) return;
    let cancelled = false;
    void fetchSystemUpdateStatus({ host, ...creds })
      .then((status) => {
        if (cancelled || watchingRef.current) return;
        if (status.phase !== 'downloading' && status.phase !== 'rebooting') return;
        const startedAt = status.startedAt ? Date.parse(status.startedAt) : Date.now();
        setInstalling(true);
        setProgress(firmwareProgress(status));
        watchingRef.current = true;
        watchUpdate(Number.isNaN(startedAt) ? Date.now() : startedAt);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // watchUpdate reads the latest creds and host through this effect's own deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, creds]);

  const install = async () => {
    setConfirming(false);
    if (!creds || !host) return;
    setInstalling(true);
    setComplete(false);
    setProgress({ value: 5, step: 'starting' });
    try {
      const result = await installUpdate({ host, ...creds });
      if (!result.updateAvailable) {
        setInstalling(false);
        setProgress(null);
        toast.notify({ title: t('updates.firmware.alreadyUpToDate'), tone: 'success' });
        await reload();
        return;
      }
      watchingRef.current = true;
      watchUpdate(Date.now());
    } catch (err) {
      setInstalling(false);
      setProgress(null);
      toast.notify({
        title: t('updates.firmware.failed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
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

            {progress ? (
              <Progress
                value={progress.value}
                label={
                  progress.percent !== undefined
                    ? t('updates.progress.downloadingFirmwarePercent', {
                        percent: format.number(progress.percent),
                      })
                    : t(`updates.progress.${progress.step}`)
                }
                tone={progress.value > 60 ? 'success' : 'info'}
              />
            ) : null}

            {check?.updateAvailable || downloaded || installing ? (
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
