import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Blocks, Download, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
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
  installPlugin,
  uninstallPlugin,
  type PluginCredentials,
  type PluginInfoResponse,
} from '../api';
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

const PLUGIN_INSTALL_STEPS: Record<string, { value: number; label: string }> = {
  preparing: { value: 5, label: 'Preparing' },
  creating_interface: { value: 15, label: 'Creating interface' },
  creating_mounts: { value: 25, label: 'Creating mounts' },
  running_pre_install_script: { value: 35, label: 'Running pre-install script' },
  creating_container: { value: 45, label: 'Creating container' },
  pulling: { value: 65, label: 'Pulling image' },
  starting_container: { value: 85, label: 'Starting container' },
  running_post_install_script: { value: 95, label: 'Running post-install script' },
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
): { tone: 'success' | 'danger' | 'info' | 'neutral'; label: string } | null {
  if (plugin.failed) return { tone: 'danger', label: 'failed' };
  if (plugin.installing || localInstalling) return { tone: 'info', label: 'installing' };
  if (plugin.running) return { tone: 'success', label: 'running' };
  if (plugin.installed) return { tone: 'neutral', label: 'installed' };
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
  const { getCredentials } = useSession();
  const toast = useToast();

  const [plugins, setPlugins] = useState<PluginInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installs, setInstalls] = useState<Record<string, { value: number; label: string }>>({});
  const [confirmingUninstall, setConfirmingUninstall] = useState<PluginInfoResponse | null>(null);
  const [uninstallingId, setUninstallingId] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const watchingRef = useRef(new Set<string>());

  useEffect(() => {
    const watching = watchingRef.current;
    return () => {
      watching.clear();
    };
  }, []);

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
        setPlugins(data);
        if (silent) setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load plugins.';
        if (!silent) {
          setError(message);
          setPlugins([]);
        }
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [creds],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  usePolling(() => reload(true), 5000, Boolean(creds));

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
    toast.notify({ title: `${name} install failed`, description: message, tone: 'danger' });
    void reload(true);
  };

  const watchInstall = (pluginId: string, name: string, startedAt: number) => {
    if (!watchingRef.current.has(pluginId) || !creds) return;
    if (Date.now() - startedAt > PLUGIN_INSTALL_TIMEOUT_MS) {
      failInstall(pluginId, name, 'Timed out waiting for the install to finish');
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
          failInstall(pluginId, name, status.message || 'Plugin install failed');
          return;
        }
        if (status?.phase === 'done') {
          stopWatching(pluginId);
          toast.notify({ title: `${name} installed`, tone: 'success' });
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
    setInstalls((prev) => ({ ...prev, [plugin.id]: { value: 5, label: 'Starting install' } }));
    try {
      await installPlugin(creds, plugin.id);
      watchInstall(plugin.id, plugin.name, Date.now());
    } catch (err) {
      stopWatching(plugin.id);
      toast.notify({
        title: `${plugin.name} install failed`,
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
      if (result.warnings?.length) {
        toast.notify({
          title: `${plugin.name} uninstalled with warnings`,
          description: result.warnings.join(' '),
          tone: 'warning',
        });
      } else {
        toast.notify({ title: `${plugin.name} uninstalled`, tone: 'success' });
      }
    } catch (err) {
      toast.notify({
        title: `${plugin.name} uninstall failed`,
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
      {loading && plugins.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error && plugins.length === 0 ? (
        <EmptyState
          title="Failed to load plugins"
          description={error}
          actions={<Button onClick={() => reload()}>Retry</Button>}
        />
      ) : plugins.length === 0 ? (
        <EmptyState
          title="No plugins available"
          description="The plugin registry did not return any plugins."
        />
      ) : (
        <div className={styles.grid}>
          {plugins.map((plugin) => {
            const localInstall = installs[plugin.id];
            const badge = statusBadge(plugin, Boolean(localInstall));
            const installing = Boolean(localInstall) || plugin.installing;
            return (
              <article key={plugin.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <PluginIcon plugin={plugin} />
                  <Stack $gap="4px" className={styles.cardHead}>
                    <h3 className={styles.cardTitle} title={plugin.name}>
                      {plugin.name}
                    </h3>
                    <p className={styles.cardAuthor}>
                      by{' '}
                      <a
                        href={plugin.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.cardAuthorLink}
                      >
                        {plugin.author}
                      </a>{' '}
                      · v{plugin.version}
                    </p>
                  </Stack>
                </div>
                <p className={styles.cardDesc}>{plugin.tagline}</p>
                {plugin.note ? <PluginNote note={plugin.note} failed={plugin.failed} /> : null}
                {localInstall ? (
                  <Progress value={localInstall.value} label={localInstall.label} />
                ) : null}
                <div className={styles.cardActions}>
                  <div className={styles.badgeGroup}>
                    <Badge tone="neutral" className={styles.categoryBadge}>
                      {plugin.category}
                    </Badge>
                    {badge ? <Badge tone={badge.tone}>{badge.label}</Badge> : null}
                  </div>
                  {installing ? (
                    <Button variant="primary" size="sm" loading>
                      Installing…
                    </Button>
                  ) : plugin.installed ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmingUninstall(plugin)}
                      loading={uninstallingId === plugin.id}
                    >
                      {uninstallingId === plugin.id ? (
                        'Uninstalling…'
                      ) : (
                        <>
                          <Trash2 size={14} aria-hidden /> Uninstall
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => install(plugin)}>
                      <Download size={14} aria-hidden /> Install
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
        title={`Uninstall ${confirmingUninstall?.name ?? 'plugin'}?`}
        description="The plugin container and its resources are removed from the router."
        destructive
        confirmLabel="Uninstall"
        onConfirm={uninstall}
        onCancel={() => setConfirmingUninstall(null)}
      />
    </PageShell>
  );
}
