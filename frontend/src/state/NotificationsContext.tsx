import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchNotifications,
  isAbortError,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../api';
import { usePolling } from '../utils/usePolling';
import { useSession } from './SessionContext';
import { useRouter, useRouterStore } from './RouterStoreContext';

const POLL_MS = 60_000;

interface NotificationsContextValue {
  /** Newest first. Null until the first load finishes. */
  notifications: AppNotification[] | null;
  unreadCount: number;
  /** False when no router with saved credentials is selected. */
  available: boolean;
  refresh: () => Promise<void>;
  /** Resolves false when the backend rejects the change; the read state is then restored. */
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
}

const Ctx = createContext<NotificationsContextValue | null>(null);

const byNewest = (a: AppNotification, b: AppNotification) =>
  (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRouterId, getCredentials } = useSession();
  const { lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const targetId = activeRouterId ?? lastConnectedRouterId ?? selectedRouterId ?? null;
  const router = useRouter(targetId ?? undefined);
  const host = router?.host;
  const creds = targetId ? getCredentials(targetId) : undefined;
  const auth = useMemo(() => (host && creds ? { host, ...creds } : null), [host, creds]);

  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!auth) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const list = await fetchNotifications(auth, controller.signal);
      if (!controller.signal.aborted) setNotifications([...list].sort(byNewest));
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) return;
      // Until the backend serves notifications, a failed request reads as an empty list.
      setNotifications((prev) => prev ?? []);
    }
  }, [auth]);

  // Start over when the router changes; the poll below only restarts when it turns on or off.
  useEffect(() => {
    setNotifications(null);
    void refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  usePolling(refresh, POLL_MS, Boolean(auth));

  const setRead = useCallback((ids: Set<string>, read: boolean) => {
    setNotifications((prev) => prev?.map((n) => (ids.has(n.id) ? { ...n, read } : n)) ?? prev);
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      if (!auth) return false;
      setRead(new Set([id]), true);
      try {
        await markNotificationRead(auth, id);
        return true;
      } catch {
        setRead(new Set([id]), false);
        return false;
      }
    },
    [auth, setRead],
  );

  const markAllRead = useCallback(async () => {
    if (!auth || !notifications) return false;
    const unread = new Set(notifications.filter((n) => !n.read).map((n) => n.id));
    if (unread.size === 0) return true;
    setRead(unread, true);
    try {
      await markAllNotificationsRead(auth);
      return true;
    } catch {
      setRead(unread, false);
      return false;
    }
  }, [auth, notifications, setRead]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications?.filter((n) => !n.read).length ?? 0,
      available: Boolean(auth),
      refresh,
      markRead,
      markAllRead,
    }),
    [notifications, auth, refresh, markRead, markAllRead],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
};
