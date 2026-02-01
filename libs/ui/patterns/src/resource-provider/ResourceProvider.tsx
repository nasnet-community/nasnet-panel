/**
 * Resource Provider
 *
 * React context provider for resource data and operations.
 * Provides access to resource state and mutation functions.
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 */

import * as React from 'react';

import type { Resource, ResourceLifecycleState, RuntimeState } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Resource context value
 */
export interface ResourceContextValue<TConfig = unknown> {
  /** The resource data */
  resource: Resource<TConfig> | undefined;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | undefined;
  /** Current lifecycle state */
  state: ResourceLifecycleState | undefined;
  /** Runtime state */
  runtime: RuntimeState | undefined;

  // Actions
  /** Refresh resource data */
  refresh: () => Promise<void>;
  /** Update resource configuration */
  update: (configuration: Partial<TConfig>) => Promise<void>;
  /** Validate resource */
  validate: () => Promise<void>;
  /** Apply resource to router */
  apply: (force?: boolean) => Promise<void>;
  /** Delete resource */
  remove: () => Promise<void>;

  // Predicates
  /** Whether resource is in a pending state */
  isPending: boolean;
  /** Whether resource is active on router */
  isActive: boolean;
  /** Whether resource can be edited */
  isEditable: boolean;
  /** Whether resource has validation errors */
  hasErrors: boolean;
}

// ============================================================================
// Context
// ============================================================================

const ResourceContext = React.createContext<ResourceContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access resource context
 *
 * @throws Error if used outside of ResourceProvider
 *
 * @example
 * ```tsx
 * function ResourceActions() {
 *   const { resource, state, apply, isPending } = useResourceContext();
 *
 *   return (
 *     <Button onClick={() => apply()} disabled={isPending || state !== 'VALID'}>
 *       Apply to Router
 *     </Button>
 *   );
 * }
 * ```
 */
export function useResourceContext<TConfig = unknown>(): ResourceContextValue<TConfig> {
  const context = React.useContext(ResourceContext);

  if (!context) {
    throw new Error('useResourceContext must be used within a ResourceProvider');
  }

  return context as ResourceContextValue<TConfig>;
}

/**
 * Hook to optionally access resource context (returns null if not in provider)
 */
export function useOptionalResourceContext<
  TConfig = unknown,
>(): ResourceContextValue<TConfig> | null {
  return React.useContext(ResourceContext) as ResourceContextValue<TConfig> | null;
}

// ============================================================================
// Provider Props
// ============================================================================

export interface ResourceProviderProps<TConfig = unknown> {
  /** Resource data */
  resource: Resource<TConfig> | undefined;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Refresh function */
  onRefresh?: () => Promise<void>;
  /** Update function */
  onUpdate?: (configuration: Partial<TConfig>) => Promise<void>;
  /** Validate function */
  onValidate?: () => Promise<void>;
  /** Apply function */
  onApply?: (force?: boolean) => Promise<void>;
  /** Remove function */
  onRemove?: () => Promise<void>;
  /** Children */
  children: React.ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Provider component for resource context
 *
 * @example
 * ```tsx
 * function ResourceDetailPage({ uuid }: { uuid: string }) {
 *   const { resource, loading, error, refetch } = useResource(uuid);
 *   const { mutate: applyResource } = useApplyResource();
 *   const { mutate: updateResource } = useUpdateResource();
 *   const { mutate: deleteResource } = useDeleteResource();
 *   const { mutate: validateResource } = useValidateResource();
 *
 *   return (
 *     <ResourceProvider
 *       resource={resource}
 *       loading={loading}
 *       error={error?.message}
 *       onRefresh={refetch}
 *       onUpdate={(config) => updateResource({ uuid, configuration: config })}
 *       onValidate={() => validateResource(uuid)}
 *       onApply={(force) => applyResource(uuid, { force })}
 *       onRemove={() => deleteResource(uuid)}
 *     >
 *       <ResourceHeader />
 *       <ResourceConfigForm />
 *       <ResourceActions />
 *     </ResourceProvider>
 *   );
 * }
 * ```
 */
export function ResourceProvider<TConfig = unknown>({
  resource,
  loading = false,
  error,
  onRefresh,
  onUpdate,
  onValidate,
  onApply,
  onRemove,
  children,
}: ResourceProviderProps<TConfig>) {
  // Compute derived state
  const state = resource?.metadata?.state;
  const runtime = resource?.runtime ?? undefined;

  const isPending = state === 'VALIDATING' || state === 'APPLYING';
  const isActive = state === 'ACTIVE' || state === 'DEGRADED';
  const isEditable =
    state === 'DRAFT' ||
    state === 'VALID' ||
    state === 'ACTIVE' ||
    state === 'ERROR';
  const hasErrors =
    (resource?.validation?.errors?.length ?? 0) > 0 || state === 'ERROR';

  // Default no-op functions
  const defaultAsync = async () => {};

  const value: ResourceContextValue<TConfig> = React.useMemo(
    () => ({
      resource,
      loading,
      error,
      state,
      runtime,

      // Actions
      refresh: onRefresh ?? defaultAsync,
      update: onUpdate ?? defaultAsync,
      validate: onValidate ?? defaultAsync,
      apply: onApply ?? defaultAsync,
      remove: onRemove ?? defaultAsync,

      // Predicates
      isPending,
      isActive,
      isEditable,
      hasErrors,
    }),
    [
      resource,
      loading,
      error,
      state,
      runtime,
      onRefresh,
      onUpdate,
      onValidate,
      onApply,
      onRemove,
      isPending,
      isActive,
      isEditable,
      hasErrors,
    ]
  );

  return (
    <ResourceContext.Provider value={value as ResourceContextValue}>
      {children}
    </ResourceContext.Provider>
  );
}

ResourceProvider.displayName = 'ResourceProvider';

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Renders children only when resource is loading
 */
export const ResourceLoading: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { loading } = useResourceContext();
  return loading ? <>{children}</> : <>{fallback}</>;
};

/**
 * Renders children only when resource has an error
 */
export const ResourceError: React.FC<{
  children: (error: string) => React.ReactNode;
}> = ({ children }) => {
  const { error } = useResourceContext();
  return error ? <>{children(error)}</> : null;
};

/**
 * Renders children only when resource is loaded
 */
export const ResourceLoaded: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => {
  const { resource, loading } = useResourceContext();
  return !loading && resource ? <>{children}</> : <>{fallback}</>;
};

/**
 * Renders children only when resource is in specific states
 */
export const ResourceState: React.FC<{
  states: ResourceLifecycleState[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ states, children, fallback = null }) => {
  const { state } = useResourceContext();
  return state && states.includes(state) ? <>{children}</> : <>{fallback}</>;
};

export default ResourceProvider;
