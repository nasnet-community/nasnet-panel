/**
 * SuspenseBoundary Component
 *
 * Route-level Suspense wrapper with named skeleton fallbacks.
 * Designed for use with TanStack Router's pendingComponent pattern.
 *
 * Accessibility:
 * - Sets aria-busy on loading container
 * - Uses aria-label for context
 * - Integrates with error boundaries
 *
 * @module @nasnet/ui/patterns/suspense
 */
import { type ReactNode, type ErrorInfo } from 'react';
export interface SuspenseBoundaryProps {
    /** Content to render (lazy components) */
    children: ReactNode;
    /** Fallback UI during suspense */
    fallback: ReactNode;
    /** Name for accessibility and debugging */
    name: string;
    /** Error fallback UI */
    errorFallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
    /** Callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * SuspenseBoundary Component
 *
 * Route-level Suspense wrapper with integrated error boundary.
 * Use this for lazy-loaded route components.
 *
 * @example
 * ```tsx
 * // In route definition
 * const DashboardRoute = createLazyFileRoute('/dashboard')({
 *   component: lazy(() => import('./Dashboard')),
 *   pendingComponent: () => <DashboardSkeleton />,
 * });
 *
 * // Or wrap manually
 * <SuspenseBoundary name="Dashboard" fallback={<DashboardSkeleton />}>
 *   <Dashboard />
 * </SuspenseBoundary>
 * ```
 */
export declare function SuspenseBoundary({ children, fallback, name, errorFallback, onError, className, }: SuspenseBoundaryProps): import("react/jsx-runtime").JSX.Element;
export declare namespace SuspenseBoundary {
    var displayName: string;
}
//# sourceMappingURL=SuspenseBoundary.d.ts.map