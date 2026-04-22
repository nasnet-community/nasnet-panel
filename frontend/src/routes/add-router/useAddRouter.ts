import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
        toast.notify({ title: 'Default configuration applied', tone: 'success' });
      } catch {
        toast.notify({ title: 'Default config failed', tone: 'warning' });
      }
      navigate(`/router/${router.id}`);
    },
    [
      markConfigurationApplied,
      markConnected,
      navigate,
      setCredentials,
      state.password,
      state.username,
      toast,
      upsertRouter,
    ],
  );

  const onConnect = useCallback(async () => {
    if (!isRequired(state.username) || !isRequired(state.password)) {
      dispatch({ type: 'error', message: 'Username and password are required.' });
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
        throw new Error(`${state.host} is not reachable`);
      }
      if (!verification.isMikroTik) {
        throw new Error(`${state.host} does not appear to be a MikroTik device`);
      }
      try {
        await testCredentials(state.host, state.username, state.password);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          throw new Error('Invalid username or password');
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
      await finishAndNavigate(router);
    } catch (err) {
      dispatch({ type: 'error', message: (err as Error).message ?? 'Connection failed' });
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
  ]);

  return { onConnect };
}
