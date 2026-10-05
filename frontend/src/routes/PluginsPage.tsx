import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { Blocks, Download, ExternalLink, RefreshCw, Trash2, TriangleAlert } from 'lucide-react';
import {
  Badge,
  Button,
  ButtonLink,
  ConfirmDialog,
  EmptyState,
  PageShell,
  Progress,
  Skeleton,
  Stack,
  useToast,
} from '@nasnet/ui';
import {
  ApiError,
  fetchPlugins,
  fetchPluginInstallStatus,
  fetchPluginUpdateStatus,
  installPlugin,
  pluginViewUrl,
  uninstallPlugin,
  updatePlugin,
  type PluginCredentials,
  type PluginInfoResponse,
} from '../api';
import { useInstalledPlugins } from '../state/InstalledPluginsContext';
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import { usePolling } from '../utils/usePolling';
import {
  DeltaChatLogo,
  NasnetMonitorLogo,
  OONIProbeLogo,
  TelegramMtprotoLogo,
  XrayLogo,
} from './plugins/PluginLogos';
import styles from './PluginsPage.module.scss';

const PLUGIN_INSTALL_TIMEOUT_MS = 10 * 60 * 1000;

// `step` is a key under plugins.progress in the catalog, translated at render.
type ProgressStep =
  | 'startingInstall'
  | 'startingUpdate'
  | 'preparing'
  | 'creatingInterface'
  | 'creatingMounts'
  | 'runningPreInstall'
  | 'creatingContainer'
  | 'pullingImage'
  | 'startingContainer'
  | 'runningPostInstall'
  | 'checkingVersion'
  | 'stoppingContainer'
  | 'finishing';

interface ProgressState {
  value: number;
  step: ProgressStep;
}

const PLUGIN_INSTALL_STEPS: Record<string, ProgressState> = {
  preparing: { value: 5, step: 'preparing' },
  creating_interface: { value: 15, step: 'creatingInterface' },
  creating_mounts: { value: 25, step: 'creatingMounts' },
  running_pre_install_script: { value: 35, step: 'runningPreInstall' },
  creating_container: { value: 45, step: 'creatingContainer' },
  pulling: { value: 65, step: 'pullingImage' },
  starting_container: { value: 85, step: 'startingContainer' },
  running_post_install_script: { value: 95, step: 'runningPostInstall' },
};

const PLUGIN_UPDATE_TIMEOUT_MS = 10 * 60 * 1000;

const PLUGIN_UPDATE_STEPS: Record<string, ProgressState> = {
  checking_version: { value: 10, step: 'checkingVersion' },
  stopping_container: { value: 30, step: 'stoppingContainer' },
  repulling: { value: 60, step: 'pullingImage' },
  starting_container: { value: 85, step: 'startingContainer' },
  updating_comment: { value: 95, step: 'finishing' },
};

const FALLBACK_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  'telegram-mtproto': TelegramMtprotoLogo,
  'xray-server': XrayLogo,
  'deltachat-madmail': DeltaChatLogo,
  'ooni-probe': OONIProbeLogo,
  'nasnet-monitor': NasnetMonitorLogo,
};

function PluginIcon({ plugin }: { plugin: PluginInfoResponse }) {
  const [broken, setBroken] = useState(false);
  if (!plugin.icon || broken) {
    const Fallback = FALLBACK_LOGOS[plugin.id];
    if (Fallback) return <Fallback size={56} />;
    return (
      <span className={styles.cardIconFallback}>
        <Blocks size={32} aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={plugin.icon}
      alt=""
      width={56}
      height={56}
      className={styles.cardIcon}
      onError={() => setBroken(true)}
    />
  );
}

const NOTE_PROGRESS_RE = /^(.*?)\s*(\d+(?:\.\d+)?%)\/(\S+)$/;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PluginNote({ note, failed }: { note: string; failed: boolean }) {
  const className = failed ? styles.cardNoteFailed : styles.cardNote;
  const match = NOTE_PROGRESS_RE.exec(note);
  if (!match) return <p className={className}>{capitalize(note)}</p>;
  const [, text, percent, size] = match;
  return (
    <p className={className}>
      {capitalize(text)}
      <Badge tone={failed ? 'danger' : 'info'} className={styles.noteBadge}>
        {percent} / {size}
      </Badge>
    </p>
  );
}

function statusBadge(
  plugin: PluginInfoResponse,
  localInstalling: boolean,
): {
  tone: 'success' | 'danger' | 'info' | 'neutral';
  status: 'failed' | 'installing' | 'running' | 'installed';
} | null {
  if (plugin.failed) return { tone: 'danger', status: 'failed' };
  if (plugin.installing || localInstalling) return { tone: 'info', status: 'installing' };
  if (plugin.running) return { tone: 'success', status: 'running' };
  if (plugin.installed) return { tone: 'neutral', status: 'installed' };
  return null;
}

function CardSkeleton() {
  return (
    <article className={styles.card} aria-busy>
      <div className={styles.cardTop}>
        <Skeleton width={56} height={56} radius={14} />
        <Stack $gap="8px" className={styles.cardHead}>
          <Skeleton width={140} height={18} />
          <Skeleton width={100} height={12} />
        </Stack>
      </div>
      <Skeleton width={220} height={12} />
      <Skeleton width={180} height={12} />
      <div className={styles.cardActions}>
        <Skeleton width={72} height={22} radius={999} />
        <Skeleton width={90} height={28} radius={8} />
      </div>
    </article>
  );
}

export function PluginsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials, activeRouterId } = useSession();
  const { plugins: installedPlugins, markInstalled, markUninstalled } = useInstalledPlugins();
  const toast = useToast();
  const { t } = useTranslation('tools');

  const [plugins, setPlugins] = useState<PluginInfoResponse[]>([]);
  const [containerSupport, setContainerSupport] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installs, setInstalls] = useState<Record<string, ProgressState>>({});
  const [confirmingUninstall, setConfirmingUninstall] = useState<PluginInfoResponse | null>(null);
  const [uninstallingId, setUninstallingId] = useState<string | null>(null);
  const [updates, setUpdates] = useState<Record<string, ProgressState>>({});
  const [confirmingUpdate, setConfirmingUpdate] = useState<PluginInfoResponse | null>(null);
  const inFlightRef = useRef(false);
  const watchingRef = useRef(new Set<string>());
  const activeRouterRef = useRef(id);

  useEffect(() => {
    const watching = watchingRef.current;
    return () => {
      watching.clear();
    };
  }, []);

  useEffect(() => {
    activeRouterRef.current = id;
    inFlightRef.current = false;
    setPlugins([]);
    setContainerSupport(null);
    setLoading(true);
  }, [id]);

  // The store follows the session's active router, which is set in an effect after
  // this page first renders with a new :id, so ignore it until the two agree.
  const installedIds = useMemo(
    () => new Set(activeRouterId === id ? installedPlugins.map((p) => p.id) : []),
    [activeRouterId, id, installedPlugins],
  );

  const creds = useMemo<PluginCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const reload = useCallback(
    async (silent = false) => {
      if (!creds) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await fetchPlugins(creds);
        if (activeRouterRef.current !== id) return;
        setPlugins(data.plugins);
        setContainerSupport(data.containerSupport);
        if (silent) setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('plugins.loadFailed');
        if (activeRouterRef.current !== id) return;
        if (!silent) {
          setError(message);
          setPlugins([]);
        }
      } finally {
        if (activeRouterRef.current === id) {
          inFlightRef.current = false;
          setLoading(false);
        }
      }
    },
    [creds, id, t],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  usePolling(() => reload(true), 5000, Boolean(creds) && containerSupport !== false);

  const stopWatching = (pluginId: string) => {
    watchingRef.current.delete(pluginId);
    setInstalls((prev) => {
      const next = { ...prev };
      delete next[pluginId];
      return next;
    });
  };

  const failInstall = (pluginId: string, name: string, message: string) => {
    stopWatching(pluginId);
    toast.notify({
      title: t('plugins.toasts.installFailed', { name }),
      description: message,
      tone: 'danger',
    });
    void reload(true);
  };

  const watchInstall = (pluginId: string, name: string, startedAt: number) => {
    if (!watchingRef.current.has(pluginId) || !creds) return;
    if (Date.now() - startedAt > PLUGIN_INSTALL_TIMEOUT_MS) {
      failInstall(pluginId, name, t('plugins.toasts.installTimeout'));
      return;
    }
    void fetchPluginInstallStatus(creds, pluginId)
      .then(
        (status) => status,
        (err) => (err instanceof ApiError && err.status === 404 ? ('gone' as const) : null),
      )
      .then((status) => {
        if (!watchingRef.current.has(pluginId)) return;
        if (status === 'gone') {
          stopWatching(pluginId);
          void reload(true);
          return;
        }
        if (status?.phase === 'error') {
          failInstall(pluginId, name, status.message || t('plugins.toasts.installFailedDetail'));
          return;
        }
        if (status?.phase === 'done') {
          stopWatching(pluginId);
          markInstalled({ id: pluginId, name });
          toast.notify({ title: t('plugins.toasts.installed', { name }), tone: 'success' });
          void reload(true);
          return;
        }
        const step = status ? PLUGIN_INSTALL_STEPS[status.phase] : undefined;
        if (step) setInstalls((prev) => ({ ...prev, [pluginId]: step }));
        window.setTimeout(() => watchInstall(pluginId, name, startedAt), 2000);
      });
  };

  const install = async (plugin: PluginInfoResponse) => {
    if (!creds) return;
    watchingRef.current.add(plugin.id);
    setInstalls((prev) => ({ ...prev, [plugin.id]: { value: 5, step: 'startingInstall' } }));
    try {
      await installPlugin(creds, plugin.id);
      watchInstall(plugin.id, plugin.name, Date.now());
    } catch (err) {
      stopWatching(plugin.id);
      toast.notify({
        title: t('plugins.toasts.installFailed', { name: plugin.name }),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      void reload(true);
    }
  };

  const stopUpdate = (pluginId: string) => {
    watchingRef.current.delete(pluginId);
    setUpdates((prev) => {
      const next = { ...prev };
      delete next[pluginId];
      return next;
    });
  };

  const failUpdate = (pluginId: string, name: string, message: string) => {
    stopUpdate(pluginId);
    toast.notify({
      title: t('plugins.toasts.updateFailed', { name }),
      description: message,
      tone: 'danger',
    });
    void reload(true);
  };

  const watchUpdate = (pluginId: string, name: string, startedAt: number) => {
    if (!watchingRef.current.has(pluginId) || !creds) return;
    if (Date.now() - startedAt > PLUGIN_UPDATE_TIMEOUT_MS) {
      failUpdate(pluginId, name, t('plugins.toasts.updateTimeout'));
      return;
    }
    void fetchPluginUpdateStatus(creds, pluginId)
      .then(
        (status) => status,
        (err) => (err instanceof ApiError && err.status === 404 ? ('gone' as const) : null),
      )
      .then((status) => {
        if (!watchingRef.current.has(pluginId)) return;
        if (status === 'gone') {
          stopUpdate(pluginId);
          void reload(true);
          return;
        }
        if (status?.phase === 'error') {
          failUpdate(pluginId, name, status.message || t('plugins.toasts.updateFailedDetail'));
          return;
        }
        if (status?.phase === 'unconfirmed') {
          stopUpdate(pluginId);
          toast.notify({
            title: t('plugins.toasts.updateUnconfirmed', { name }),
            description: status.message || t('plugins.toasts.updateUnconfirmedDetail'),
            tone: 'warning',
          });
          void reload(true);
          return;
        }
        if (status?.phase === 'done') {
          stopUpdate(pluginId);
          toast.notify({
            title: status.version
              ? t('plugins.toasts.updatedTo', { name, version: status.version })
              : t('plugins.toasts.updated', { name }),
            tone: 'success',
          });
          void reload(true);
          return;
        }
        const step = status ? PLUGIN_UPDATE_STEPS[status.phase] : undefined;
        if (step) setUpdates((prev) => ({ ...prev, [pluginId]: step }));
        window.setTimeout(() => watchUpdate(pluginId, name, startedAt), 2000);
      });
  };

  const update = async () => {
    const plugin = confirmingUpdate;
    setConfirmingUpdate(null);
    if (!plugin || !creds) return;
    watchingRef.current.add(plugin.id);
    setUpdates((prev) => ({ ...prev, [plugin.id]: { value: 5, step: 'startingUpdate' } }));
    try {
      await updatePlugin(creds, plugin.id);
      watchUpdate(plugin.id, plugin.name, Date.now());
    } catch (err) {
      stopUpdate(plugin.id);
      toast.notify({
        title: t('plugins.toasts.updateFailed', { name: plugin.name }),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
      void reload(true);
    }
  };

  const uninstall = async () => {
    const plugin = confirmingUninstall;
    setConfirmingUninstall(null);
    if (!plugin || !creds) return;
    setUninstallingId(plugin.id);
    try {
      const result = await uninstallPlugin(creds, plugin.id);
      markUninstalled(plugin.id);
      if (result.warnings?.length) {
        toast.notify({
          title: t('plugins.toasts.uninstalledWithWarnings', { name: plugin.name }),
          description: result.warnings.join(' '),
          tone: 'warning',
        });
      } else {
        toast.notify({
          title: t('plugins.toasts.uninstalled', { name: plugin.name }),
          tone: 'success',
        });
      }
    } catch (err) {
      toast.notify({
        title: t('plugins.toasts.uninstallFailed', { name: plugin.name }),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setUninstallingId(null);
      void reload(true);
    }
  };

  return (
    <PageShell>
      {containerSupport === false ? (
        <div className={styles.unsupported} role="alert">
          <TriangleAlert size={16} aria-hidden className={styles.unsupportedIcon} />
          <p>{t('plugins.unsupported')}</p>
        </div>
      ) : null}
      {loading && plugins.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error && plugins.length === 0 ? (
        <EmptyState
          title={t('plugins.loadFailedTitle')}
          description={error}
          actions={<Button onClick={() => reload()}>{t('plugins.retry')}</Button>}
        />
      ) : plugins.length === 0 ? (
        <EmptyState title={t('plugins.noneTitle')} description={t('plugins.noneDescription')} />
      ) : (
        <div className={styles.grid}>
          {plugins.map((plugin) => {
            const localInstall = installs[plugin.id];
            const localUpdate = updates[plugin.id];
            const badge = statusBadge(plugin, Boolean(localInstall));
            const installing = Boolean(localInstall) || plugin.installing;
            const updating = Boolean(localUpdate);
            const progress = localInstall ?? localUpdate;
            // The registry list lags a just-finished install until the next reload,
            // so the installed-plugins store also counts.
            const installed = plugin.installed || installedIds.has(plugin.id);
            return (
              <article key={plugin.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <PluginIcon plugin={plugin} />
                  <Stack $gap="0" className={styles.cardHead}>
                    <h3 className={styles.cardTitle} title={plugin.name}>
                      {plugin.name}
                    </h3>
                    <p className={styles.cardAuthor}>
                      <Trans
                        t={t}
                        i18nKey="plugins.byAuthor"
                        values={{ author: plugin.author }}
                        components={{
                          anchor: (
                            // eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- Trans fills in the text
                            <a
                              href={plugin.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.cardAuthorLink}
                            />
                          ),
                        }}
                      />
                    </p>
                    <p className={styles.cardAuthor}>
                      {plugin.updateAvailable && plugin.installedVersion
                        ? t('plugins.versionWithUpdate', {
                            installed: plugin.installedVersion,
                            latest: plugin.version,
                          })
                        : `v${plugin.version}`}
                    </p>
                  </Stack>
                </div>
                <div className={styles.badgeGroup}>
                  <Badge tone="neutral" className={styles.categoryBadge}>
                    {plugin.category}
                  </Badge>
                  {badge ? (
                    <Badge tone={badge.tone}>{t(`plugins.status.${badge.status}`)}</Badge>
                  ) : null}
                </div>
                <p className={styles.cardDesc}>{plugin.tagline}</p>
                {plugin.note ? <PluginNote note={plugin.note} failed={plugin.failed} /> : null}
                {progress ? (
                  <Progress value={progress.value} label={t(`plugins.progress.${progress.step}`)} />
                ) : null}
                <div className={styles.cardActions}>
                  {installing ? (
                    <Button variant="primary" size="sm" loading>
                      {t('plugins.installing')}
                    </Button>
                  ) : updating ? (
                    <Button variant="primary" size="sm" loading>
                      {t('plugins.updating')}
                    </Button>
                  ) : installed ? (
                    <div className={styles.cardButtons}>
                      {plugin.failed ? null : (
                        <ButtonLink
                          variant="primary"
                          size="sm"
                          href={pluginViewUrl(plugin.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={14} aria-hidden className="rtl-flip" />{' '}
                          {t('plugins.open')}
                        </ButtonLink>
                      )}
                      {plugin.updateAvailable ? (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setConfirmingUpdate(plugin)}
                        >
                          <RefreshCw size={14} aria-hidden /> {t('plugins.update')}
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        className={styles.uninstallButton}
                        onClick={() => setConfirmingUninstall(plugin)}
                        loading={uninstallingId === plugin.id}
                      >
                        {uninstallingId === plugin.id ? (
                          t('plugins.uninstalling')
                        ) : (
                          <>
                            <Trash2 size={14} aria-hidden /> {t('plugins.uninstall')}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : containerSupport === false ? (
                    <Button variant="secondary" size="sm" disabled>
                      {t('plugins.unavailable')}
                    </Button>
                  ) : plugin.canInstall ? (
                    <Button variant="primary" size="sm" onClick={() => install(plugin)}>
                      <Download size={14} aria-hidden /> {t('plugins.install')}
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      {t('plugins.comingSoon')}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmingUninstall !== null}
        title={t('plugins.confirmUninstall.title', {
          name: confirmingUninstall?.name ?? t('plugins.pluginFallback'),
        })}
        description={t('plugins.confirmUninstall.description')}
        destructive
        confirmLabel={t('plugins.uninstall')}
        onConfirm={uninstall}
        onCancel={() => setConfirmingUninstall(null)}
      />

      <ConfirmDialog
        open={confirmingUpdate !== null}
        title={t('plugins.confirmUpdate.title', {
          name: confirmingUpdate?.name ?? t('plugins.pluginFallback'),
        })}
        description={t('plugins.confirmUpdate.description')}
        confirmLabel={t('plugins.update')}
        confirmVariant="success"
        onConfirm={update}
        onCancel={() => setConfirmingUpdate(null)}
      />
    </PageShell>
  );
}
