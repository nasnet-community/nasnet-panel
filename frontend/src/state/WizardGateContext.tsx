import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, fetchWizardStatus, isAbortError } from '../api';
import { useSession } from './SessionContext';
import { useRouter } from './RouterStoreContext';

export type WizardGateStatus = 'unknown' | 'fresh' | 'completed' | 'unreachable';

interface WizardGateContextValue {
  statusFor: (routerId: string | null | undefined) => WizardGateStatus;
  markCompleted: (routerId: string) => void;
  retry: () => void;
}

const Ctx = createContext<WizardGateContextValue | null>(null);

const RETRY_DELAY_MS = 5000;

export const WizardGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRouterId, getCredentials } = useSession();
  const router = useRouter(activeRouterId ?? undefined);
  const host = router?.host;
  const [statuses, setStatuses] = useState<Record<string, WizardGateStatus>>({});
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!activeRouterId || !host) return;
    const creds = getCredentials(activeRouterId);
    if (!creds) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      let next: WizardGateStatus;
      try {
        const status = await fetchWizardStatus({ host, ...creds }, controller.signal);
        next = status.completed ? 'completed' : 'fresh';
      } catch (err) {
        if (isAbortError(err)) return;
        next = err instanceof ApiError && err.status === 401 ? 'unknown' : 'unreachable';
      }
      if (controller.signal.aborted) return;
      setStatuses((prev) => ({ ...prev, [activeRouterId]: next }));
      if (next === 'unreachable') {
        timer = setTimeout(() => {
          void check();
        }, RETRY_DELAY_MS);
      }
    };

    void check();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeRouterId, host, getCredentials, retryToken]);

  const statusFor = useCallback(
    (routerId: string | null | undefined): WizardGateStatus =>
      routerId ? (statuses[routerId] ?? 'unknown') : 'unknown',
    [statuses],
  );

  const markCompleted = useCallback((routerId: string) => {
    setStatuses((prev) => ({ ...prev, [routerId]: 'completed' }));
  }, []);

  const retry = useCallback(() => setRetryToken((n) => n + 1), []);

  const value = useMemo(
    () => ({ statusFor, markCompleted, retry }),
    [statusFor, markCompleted, retry],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useWizardGate = (): WizardGateContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWizardGate must be used inside <WizardGateProvider>');
  return ctx;
};
