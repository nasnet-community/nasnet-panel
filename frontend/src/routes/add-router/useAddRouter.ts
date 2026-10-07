import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@nasnet/ui';
import { ApiError, api, testCredentials, verifyIP, type Router } from '../../api';
import { useRouterStore } from '../../state/RouterStoreContext';
import { useSession } from '../../state/SessionContext';
import { isRequired } from '../../utils/validators';
import { buildDefaultBaseConfig } from '../../utils/rsc-builder';
import type { Action, WizardState } from './state';

interface Options {
  onDuplicate?: (existing: Router) => void;
}

export function useAddRouter(
  state: WizardState,
  dispatch: React.Dispatch<Action>,
  { onDuplicate }: Options = {},
) {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation('addRouter');
  const { routers, upsertRouter, markConnected, markConfigurationApplied } = useRouterStore();
  const { setCredentials } = useSession();

  const finishAndNavigate = useCallback(
    async (router: Router) => {
      upsertRouter(router);
      markConnected(router.id);
      setCredentials(router.id, { username: state.username, password: state.password });
      try {
        await api.batch.applyConfig(buildDefaultBaseConfig());
        const updated = await api.routers.markConfigurationApplied(router.id);
        if (updated) {
          markConfigurationApplied(router.id, updated.configurationAppliedAt);
          upsertRouter(updated);
        }
        toast.notify({ title: t('toasts.configApplied'), tone: 'success' });
      } catch {
        toast.notify({ title: t('toasts.configFailed'), tone: 'warning' });
      }
      navigate(`/router/${router.id}`);
    },
    [
      markConfigurationApplied,
      markConnected,
      navigate,
      setCredentials,
      state.password,
      t,
      state.username,
      toast,
      upsertRouter,
    ],
  );

  const onConnect = useCallback(async () => {
    if (!isRequired(state.username)) {
      dispatch({ type: 'error', message: t('errors.usernameRequired') });
      return;
    }
    const duplicate = routers.find((r) => r.host === state.host);
    if (duplicate) {
      onDuplicate?.(duplicate);
      return;
    }
    dispatch({ type: 'applying', value: true });
    try {
      const verification = await verifyIP(state.host);
      if (!verification.isOnline) {
        throw new Error(t('errors.notReachable', { host: state.host }));
      }
      if (!verification.isMikroTik) {
        throw new Error(t('errors.notMikroTik', { host: state.host }));
      }
      try {
        await testCredentials(state.host, state.username, state.password);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          throw new Error(t('errors.invalidCredentials'));
        }
        throw err;
      }
      const router = await api.routers.add({
        name: state.name || `Router at ${state.host}`,
        host: state.host,
        port: 443,
        username: state.username,
        password: state.password,
      });
      await finishAndNavigate({ ...router, hostname: verification.hostname });
    } catch (err) {
      dispatch({ type: 'error', message: (err as Error).message ?? t('errors.connectionFailed') });
    } finally {
      dispatch({ type: 'applying', value: false });
    }
  }, [
    dispatch,
    finishAndNavigate,
    onDuplicate,
    routers,
    state.host,
    state.name,
    state.password,
    state.username,
    t,
  ]);

  return { onConnect };
}
