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
    /** Whether resource is in a pending state */
    isPending: boolean;
    /** Whether resource is active on router */
    isActive: boolean;
    /** Whether resource can be edited */
    isEditable: boolean;
    /** Whether resource has validation errors */
    hasErrors: boolean;
}
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
export declare function useResourceContext<TConfig = unknown>(): ResourceContextValue<TConfig>;
/**
 * Hook to optionally access resource context (returns null if not in provider)
 */
export declare function useOptionalResourceContext<TConfig = unknown>(): ResourceContextValue<TConfig> | null;
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
export declare function ResourceProvider<TConfig = unknown>({ resource, loading, error, onRefresh, onUpdate, onValidate, onApply, onRemove, children, }: ResourceProviderProps<TConfig>): import("react/jsx-runtime").JSX.Element;
export declare namespace ResourceProvider {
    var displayName: string;
}
/**
 * Renders children only when resource is loading
 */
export declare const ResourceLoading: React.FC<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
}>;
/**
 * Renders children only when resource has an error
 */
export declare const ResourceError: React.FC<{
    children: (error: string) => React.ReactNode;
}>;
/**
 * Renders children only when resource is loaded
 */
export declare const ResourceLoaded: React.FC<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
}>;
/**
 * Renders children only when resource is in specific states
 */
export declare const ResourceState: React.FC<{
    states: ResourceLifecycleState[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}>;
export default ResourceProvider;
//# sourceMappingURL=ResourceProvider.d.ts.map