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
        if (current.status !== nextStatus || current.lastSeen !== nextLastSeen) {
          upsertRef.current({ ...current, status: nextStatus, lastSeen: nextLastSeen });
        }
        markProbed(id);
      } catch {
        // aborted or network error: leave skeleton showing; next tick retries
      }
    };

    const tick = () => {
      for (const r of routersRef.current) void checkOne(r.id, r.host);
    };

    tick();
    const interval = window.setInterval(tick, intervalMs);

    return () => {
      try {
        controller.abort();
      } catch {
        /* some environments throw when aborting an already-aborted controller */
      }
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerPollKey, enabled, intervalMs]);

  return probedIds;
}
