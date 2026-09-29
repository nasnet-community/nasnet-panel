import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchInstalledPlugins, type InstalledPluginResponse } from '../api';
import { useSession } from './SessionContext';
import { useRouter } from './RouterStoreContext';

interface InstalledPluginsContextValue {
  plugins: InstalledPluginResponse[];
  markInstalled: (plugin: InstalledPluginResponse) => void;
  markUninstalled: (pluginId: string) => void;
}

const Ctx = createContext<InstalledPluginsContextValue | null>(null);

const NO_PLUGINS: InstalledPluginResponse[] = [];

export const InstalledPluginsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRouterId, getCredentials } = useSession();
  const router = useRouter(activeRouterId ?? undefined);
  const host = router?.host;
  const creds = activeRouterId ? getCredentials(activeRouterId) : undefined;
  const [plugins, setPlugins] = useState<InstalledPluginResponse[]>([]);
  // The router `plugins` belongs to. It lags `activeRouterId` by one render on a
  // switch, and never catches up for a router without stored credentials.
  const [loadedRouterId, setLoadedRouterId] = useState<string | null>(null);
  const loadedRef = useRef<string | null>(null);
  const mutationRef = useRef(0);

  useEffect(() => {
    if (!activeRouterId || !host || !creds) return;
    if (loadedRef.current !== activeRouterId) {
      if (loadedRef.current !== null) setPlugins([]);
      loadedRef.current = activeRouterId;
      setLoadedRouterId(activeRouterId);
    }
    const mutation = mutationRef.current;
    const controller = new AbortController();
    void fetchInstalledPlugins({ host, ...creds }, controller.signal)
      .then((installed) => {
        if (controller.signal.aborted || mutation !== mutationRef.current) return;
        setPlugins(installed);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [activeRouterId, host, creds]);

  const markInstalled = useCallback((plugin: InstalledPluginResponse) => {
    mutationRef.current += 1;
    setPlugins((prev) =>
      prev.some((p) => p.id === plugin.id)
        ? prev
        : [...prev, plugin].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  const markUninstalled = useCallback((pluginId: string) => {
    mutationRef.current += 1;
    setPlugins((prev) => prev.filter((p) => p.id !== pluginId));
  }, []);

  const value = useMemo(
    () => ({
      plugins: loadedRouterId === activeRouterId ? plugins : NO_PLUGINS,
      markInstalled,
      markUninstalled,
    }),
    [loadedRouterId, activeRouterId, plugins, markInstalled, markUninstalled],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useInstalledPlugins = (): InstalledPluginsContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInstalledPlugins must be used inside <InstalledPluginsProvider>');
  return ctx;
};
