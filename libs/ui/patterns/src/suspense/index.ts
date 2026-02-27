/**
 * Suspense Utilities
 *
 * Components and utilities for lazy loading, code splitting,
 * and Suspense boundaries.
 *
 * @module @nasnet/ui/patterns/suspense
 */

// LazyBoundary - Original lazy loading wrapper
export {
  LazyBoundary,
  SkeletonLoader,
  withLazyBoundary,
  preloadComponent,
  createLazyWithPreload,
  type LazyBoundaryProps,
  type SkeletonLoaderProps,
  type WithLazyBoundaryOptions,
} from './LazyBoundary';

// SuspenseBoundary - Route-level Suspense wrapper
export { SuspenseBoundary } from './SuspenseBoundary';
export type { SuspenseBoundaryProps } from './SuspenseBoundary';

// LazyRoute - TanStack Router lazy loading utilities
export { createLazyRoute, preloadRoutes, createPreloadHandlers } from './LazyRoute';
export type { LazyRouteConfig, LazyRouteResult } from './LazyRoute';
