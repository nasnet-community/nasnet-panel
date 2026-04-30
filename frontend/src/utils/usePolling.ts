import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timeoutId: number | null = null;

    const runRound = async () => {
      timeoutId = null;
      if (cancelled) return;
      await cbRef.current();
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
    };
  }, [enabled, intervalMs]);
}
