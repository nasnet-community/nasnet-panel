import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchWizardStatus } from '../api';
import { useSession } from './SessionContext';
import { useRouter } from './RouterStoreContext';

export type WizardGateStatus = 'unknown' | 'fresh' | 'completed';

interface WizardGateContextValue {
  statusFor: (routerId: string | null | undefined) => WizardGateStatus;
  markCompleted: (routerId: string) => void;
}

const Ctx = createContext<WizardGateContextValue | null>(null);

export const WizardGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRouterId, getCredentials } = useSession();
  const router = useRouter(activeRouterId ?? undefined);
  const host = router?.host;
  const [statuses, setStatuses] = useState<Record<string, WizardGateStatus>>({});

  useEffect(() => {
    if (!activeRouterId || !host) return;
    const creds = getCredentials(activeRouterId);
    if (!creds) return;
    const controller = new AbortController();
    void (async () => {
      let next: WizardGateStatus;
      try {
        const status = await fetchWizardStatus({ host, ...creds }, controller.signal);
        next = status.completed ? 'completed' : 'fresh';
      } catch {
        next = 'fresh';
      }
      if (controller.signal.aborted) return;
      setStatuses((prev) => ({ ...prev, [activeRouterId]: next }));
    })();
    return () => controller.abort();
  }, [activeRouterId, host, getCredentials]);

  const statusFor = useCallback(
    (routerId: string | null | undefined): WizardGateStatus =>
      routerId ? (statuses[routerId] ?? 'unknown') : 'unknown',
    [statuses],
  );

  const markCompleted = useCallback((routerId: string) => {
    setStatuses((prev) => ({ ...prev, [routerId]: 'completed' }));
  }, []);

  const value = useMemo(() => ({ statusFor, markCompleted }), [statusFor, markCompleted]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useWizardGate = (): WizardGateContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWizardGate must be used inside <WizardGateProvider>');
  return ctx;
};
