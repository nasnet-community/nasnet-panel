import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { Router } from '@nasnet/mocks';
import { api } from '../api';

const STORAGE_KEY = 'nasnet-panel.router-store.v1';

interface State {
  routers: Router[];
  selectedRouterId: string | null;
  lastConnectedRouterId: string | null;
}

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'upsert'; router: Router }
  | { type: 'remove'; id: string }
  | { type: 'replace'; routers: Router[] }
  | { type: 'mergeFromRemote'; remote: Router[] }
  | { type: 'select'; id: string | null }
  | { type: 'markConnected'; id: string }
  | { type: 'markConfigurationApplied'; id: string; appliedAt: string };

const initial: State = {
  routers: [],
  selectedRouterId: null,
  lastConnectedRouterId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'upsert': {
      const without = state.routers.filter((r) => r.id !== action.router.id);
      return { ...state, routers: [...without, action.router] };
    }
    case 'remove':
      return {
        ...state,
        routers: state.routers.filter((r) => r.id !== action.id),
        selectedRouterId: state.selectedRouterId === action.id ? null : state.selectedRouterId,
        lastConnectedRouterId:
          state.lastConnectedRouterId === action.id ? null : state.lastConnectedRouterId,
      };
    case 'replace':
      return { ...state, routers: action.routers };
    case 'mergeFromRemote': {
      const existingById = new Map(state.routers.map((r) => [r.id, r]));
      const merged = action.remote.map((incoming) => {
        const existing = existingById.get(incoming.id);
        if (!existing) return incoming;
        return { ...incoming, status: existing.status, lastSeen: existing.lastSeen };
      });
      return { ...state, routers: merged };
    }
    case 'select':
      return { ...state, selectedRouterId: action.id };
    case 'markConnected':
      return { ...state, lastConnectedRouterId: action.id };
    case 'markConfigurationApplied':
      return {
        ...state,
        routers: state.routers.map((r) =>
          r.id === action.id ? { ...r, configurationAppliedAt: action.appliedAt } : r,
        ),
      };
    default:
      return state;
  }
}

interface RouterStoreContextValue extends State {
  upsertRouter: (router: Router) => void;
  removeRouter: (id: string) => void;
  replaceRouters: (routers: Router[]) => void;
  selectRouter: (id: string | null) => void;
  markConnected: (id: string) => void;
  markConfigurationApplied: (id: string, appliedAt?: string) => void;
  getRouter: (id: string) => Router | undefined;
}

const Ctx = createContext<RouterStoreContextValue | null>(null);

export const RouterStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed && Array.isArray(parsed.routers)) {
          dispatch({ type: 'hydrate', state: parsed });
        }
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    void api.routers.list().then((list) => {
      if (cancelled) return;
      dispatch({ type: 'mergeFromRemote', remote: list });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<RouterStoreContextValue>(() => {
    const getRouter = (id: string) => state.routers.find((r) => r.id === id);
    return {
      ...state,
      upsertRouter: (router) => dispatch({ type: 'upsert', router }),
      removeRouter: (id) => dispatch({ type: 'remove', id }),
      replaceRouters: (routers) => dispatch({ type: 'replace', routers }),
      selectRouter: (id) => dispatch({ type: 'select', id }),
      markConnected: (id) => dispatch({ type: 'markConnected', id }),
      markConfigurationApplied: (id, appliedAt) =>
        dispatch({
          type: 'markConfigurationApplied',
          id,
          appliedAt: appliedAt ?? new Date().toISOString(),
        }),
      getRouter,
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useRouterStore = (): RouterStoreContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRouterStore must be used inside <RouterStoreProvider>');
  return ctx;
};

export const useRouter = (id: string | undefined): Router | undefined => {
  const { routers } = useRouterStore();
  return useMemo(() => (id ? routers.find((r) => r.id === id) : undefined), [id, routers]);
};

export const useResetRouterStore = (): (() => void) => {
  const { replaceRouters, selectRouter } = useRouterStore();
  return useCallback(() => {
    replaceRouters([]);
    selectRouter(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [replaceRouters, selectRouter]);
};
