import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppWindow,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Download,
  GitBranch,
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
  api,
  checkForUpdates,
  fetchUpdateInfo,
  installUpdate,
  type AppUpdateInfo,
  type UpdateCheckResponse,
  type UpdateInfoResponse,
} from '../api';
import { useRouterStore } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { RouterTabBar } from '../layout/RouterTabBar';
import styles from './UpdatesPage.module.scss';

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __APP_VERSION__: string;

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
  const [appInfo, setAppInfo] = useState<AppUpdateInfo | null>(null);

  const reloadApp = useCallback(async () => {
    setAppInfo(await api.updates.checkApp());
  }, []);

  useEffect(() => {
    void reloadApp();
  }, [reloadApp]);

  return (
    <>
      <RouterTabBar />
      <PageShell>
        <PageHeader>
          <div>
            <PageTitle>Updates</PageTitle>
            <PageSubtitle>Keep the Nasnet Panel app and RouterOS firmware up to date.</PageSubtitle>
          </div>
        </PageHeader>

        <div className={styles.cardGrid}>
          <AppUpdateCard info={appInfo} reload={reloadApp} />
          <FirmwareUpdateCard />
        </div>
      </PageShell>
    </>
  );
}

function AppUpdateCard({
  info,
  reload,
}: {
  info: AppUpdateInfo | null;
  reload: () => Promise<void>;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const toast = useToast();

  const install = async () => {
    setProgress(0);
    setComplete(false);
    for await (const pct of api.updates.installApp()) {
      setProgress(pct);
    }
    setComplete(true);
    toast.notify({ title: 'Update complete', tone: 'success' });
    await reload();
  };

  if (!info) {
    return (
      <Card>
        <Stack>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <AppWindow size={18} aria-hidden />
              </span>
              <h3 style={{ margin: 0 }}>App update</h3>
            </div>
          </div>
          <VersionTrackSkeleton />
        </Stack>
      </Card>
    );
  }

  const installing = progress !== null && !complete;
  const currentVersion = __APP_VERSION__;
  const updateAvailable = info.latestVersion !== currentVersion;

  return (
    <Card>
      <Stack>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <AppWindow size={18} aria-hidden />
              </span>
              <h3 style={{ margin: 0 }}>App update</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              {updateAvailable
                ? 'A newer version of Nasnet Panel is available.'
                : 'You are running the latest version.'}
            </p>
          </div>
          <span className={styles.badgeRow}>
            <Badge tone={updateAvailable ? 'warning' : 'success'}>
              {updateAvailable ? null : (
                <Check
                  size={12}
                  strokeWidth={2.5}
                  aria-hidden
                  style={{ marginRight: 4, verticalAlign: '-2px' }}
                />
              )}
              {updateAvailable ? 'update available' : 'up to date'}
            </Badge>
          </span>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.metaPill}>
            <Tag size={14} aria-hidden />
            <span>v{currentVersion}</span>
          </div>
          <div className={styles.metaPill}>
            <GitBranch size={14} aria-hidden />
            <span>stable</span>
          </div>
        </div>

        <div className={styles.versionTrack}>
          <div className={styles.versionStop}>
            <span className={styles.versionStopLabel}>
              <Tag size={12} aria-hidden /> Current
            </span>
            <span className={styles.versionStopValue} data-testid="app-current-version">
              {currentVersion}
            </span>
          </div>
          <ArrowRight
            size={20}
            aria-hidden
            className={`${styles.versionArrow} ${updateAvailable ? styles.versionArrowActive : ''}`}
          />
          <div
            className={`${styles.versionStop} ${
              updateAvailable ? styles.versionStopHighlight : styles.versionStopMatched
            }`}
          >
            <span className={styles.versionStopLabel}>
              <Sparkles size={12} aria-hidden /> Latest
            </span>
            <span className={styles.versionStopValue} data-testid="app-latest-version">
              {info.latestVersion}
            </span>
          </div>
        </div>

        {info.changelog ? (
          <div>
            <div className={styles.changelogTitle}>Changelog</div>
            <pre className={styles.changelog}>{info.changelog}</pre>
          </div>
        ) : null}

        {progress !== null ? (
          <Progress value={progress} label={complete ? 'Done' : 'Installing app update'} />
        ) : null}

        <div className={styles.actions}>
          <Button variant="success" onClick={install} disabled={!updateAvailable || installing}>
            {installing ? (
              <>
                <Loader2 size={14} aria-hidden /> Installing…
              </>
            ) : (
              <>
                <Download size={14} aria-hidden /> Install app
              </>
            )}
          </Button>
        </div>
      </Stack>
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
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setLoading(false);
    }
  }, [host, creds]);

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
        setError(err instanceof Error ? err.message : 'Failed to check for updates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [host, creds]);

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
          title: 'Firmware update started',
          description: result.message || 'Router will reboot to apply the update.',
          tone: 'success',
        });
      } else {
        toast.notify({
          title: 'Firmware update failed',
          description: result.message,
          tone: 'danger',
        });
      }
      await reload();
    } catch (err) {
      toast.notify({
        title: 'Firmware update failed',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setInstalling(false);
    }
  };

  const channel = meta?.channel || check?.channel;

  return (
    <Card>
      <Stack>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <RouterOSIcon size={18} />
              </span>
              <h3 style={{ margin: 0 }}>RouterOS firmware</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              {targetRouter
                ? `Install the latest RouterOS release on ${targetRouter.name}.`
                : 'Connect to a router to check firmware.'}
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
                    style={{ marginRight: 4, verticalAlign: '-2px' }}
                  />
                )}
                {check.updateAvailable ? 'update available' : 'up to date'}
              </Badge>
            </span>
          ) : null}
        </div>

        {!ready ? (
          <p className={styles.emptyNote}>
            Connect to a router first to check for firmware updates.
          </p>
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

                <div className={styles.versionTrack}>
                  <div className={styles.versionStop}>
                    <span className={styles.versionStopLabel}>
                      <Tag size={12} aria-hidden /> Current
                    </span>
                    <span className={styles.versionStopValue}>{check.installedVersion || '—'}</span>
                  </div>
                  <ArrowRight
                    size={20}
                    aria-hidden
                    className={`${styles.versionArrow} ${
                      check.updateAvailable ? styles.versionArrowActive : ''
                    }`}
                  />
                  <div
                    className={`${styles.versionStop} ${
                      check.updateAvailable
                        ? styles.versionStopHighlight
                        : styles.versionStopMatched
                    }`}
                  >
                    <span className={styles.versionStopLabel}>
                      <Sparkles size={12} aria-hidden /> Latest
                    </span>
                    <span className={styles.versionStopValue}>{check.latestVersion || '—'}</span>
                  </div>
                </div>
              </>
            ) : null}

            {check?.updateAvailable ? (
              <div className={styles.actions}>
                <Button variant="success" onClick={() => setConfirming(true)} disabled={installing}>
                  {installing ? (
                    <>
                      <Loader2 size={14} aria-hidden /> Installing…
                    </>
                  ) : complete ? (
                    <>
                      <CheckCircle2 size={14} aria-hidden /> Done
                    </>
                  ) : (
                    <>
                      <Download size={14} aria-hidden /> Install firmware
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
        title="Install RouterOS firmware?"
        description="The router will reboot after the package is applied. Connectivity drops briefly."
        destructive
        confirmLabel="Confirm"
        onConfirm={install}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
