import { useEffect, useMemo, useRef, useState } from 'react';
import { verifyIP, type Router } from '../api';

interface Options {
  intervalMs: number;
  enabled: boolean;
}

export function useRouterStatusPolling(
  routers: Router[],
  upsertRouter: (router: Router) => void,
  { intervalMs, enabled }: Options,
): Set<string> {
  const [probedIds, setProbedIds] = useState<Set<string>>(() => new Set());

  const routersRef = useRef(routers);
  const upsertRef = useRef(upsertRouter);
  useEffect(() => {
    routersRef.current = routers;
    upsertRef.current = upsertRouter;
  }, [routers, upsertRouter]);

  const routerPollKey = useMemo(() => routers.map((r) => `${r.id}:${r.host}`).join('|'), [routers]);

  useEffect(() => {
    if (!enabled) return;
    if (routers.length === 0) return;
    const controller = new AbortController();
    let cancelled = false;
    let timeoutId: number | null = null;

    const markProbed = (id: string) => {
      setProbedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    };

    const checkOne = async (id: string, host: string) => {
      try {
        const result = await verifyIP(host, controller.signal);
        if (controller.signal.aborted) return;
        const current = routersRef.current.find((r) => r.id === id);
        if (!current) return;
        const nextStatus: Router['status'] = result.isOnline ? 'online' : 'offline';
        const nextLastSeen = result.isOnline ? new Date().toISOString() : current.lastSeen;
        const nextHostname = result.hostname ?? current.hostname;
        if (
          current.status !== nextStatus ||
          current.lastSeen !== nextLastSeen ||
          current.hostname !== nextHostname
        ) {
          upsertRef.current({
            ...current,
            status: nextStatus,
            lastSeen: nextLastSeen,
            hostname: nextHostname,
          });
        }
        markProbed(id);
      } catch {
        // aborted or network error: leave skeleton showing; next round retries
      }
    };

    const runRound = async () => {
      timeoutId = null;
      if (cancelled) return;
      for (const r of routersRef.current) {
        if (cancelled || controller.signal.aborted) return;
        await checkOne(r.id, r.host);
      }
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      timeoutId = window.setTimeout(() => {
        void runRound();
      }, intervalMs);
    };

    const onVisibility = () => {
      if (cancelled) return;
      if (document.visibilityState === 'visible' && timeoutId === null) void runRound();
    };
    document.addEventListener('visibilitychange', onVisibility);

    void runRound();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      try {
        controller.abort();
      } catch {
        /* some environments throw when aborting an already-aborted controller */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerPollKey, enabled, intervalMs]);

  return probedIds;
}
