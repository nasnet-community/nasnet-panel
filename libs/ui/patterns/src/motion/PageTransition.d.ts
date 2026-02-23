/**
 * PageTransition
 * Provides smooth transitions between routes using Framer Motion.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import { type ReactNode } from 'react';
import { type Variants } from 'framer-motion';
export type PageTransitionVariant = 'fade' | 'slideUp' | 'none';
export interface PageTransitionProps {
    children: ReactNode;
    /** Animation variant to use */
    variant?: PageTransitionVariant;
    /** Custom variants (overrides variant prop) */
    variants?: Variants;
    /** Additional CSS classes */
    className?: string;
    /** AnimatePresence mode: 'wait' (sequential) or 'sync' (simultaneous) */
    mode?: 'wait' | 'sync' | 'popLayout';
}
/**
 * PageTransition
 *
 * Wraps page content to animate route transitions.
 * Uses the current route key to trigger animations.
 *
 * @example
 * ```tsx
 * // In __root.tsx
 * <PageTransition>
 *   <Outlet />
 * </PageTransition>
 *
 * // With custom variant
 * <PageTransition variant="slideUp">
 *   <Outlet />
 * </PageTransition>
 * ```
 */
export declare const PageTransition: import("react").NamedExoticComponent<PageTransitionProps>;
export interface PageTransitionWrapperProps {
    children: ReactNode;
    /** Unique key for this page (defaults to pathname) */
    pageKey?: string;
    /** Animation variant */
    variant?: PageTransitionVariant;
    /** Additional CSS classes */
    className?: string;
}
/**
 * PageTransitionWrapper
 *
 * Simpler wrapper that doesn't use AnimatePresence.
 * Use this when you want to animate individual page content
 * without managing exit animations at the root level.
 *
 * @example
 * ```tsx
 * // In a page component
 * export function DashboardPage() {
 *   return (
 *     <PageTransitionWrapper>
 *       <h1>Dashboard</h1>
 *       <DashboardContent />
 *     </PageTransitionWrapper>
 *   );
 * }
 * ```
 */
export declare const PageTransitionWrapper: import("react").NamedExoticComponent<PageTransitionWrapperProps>;
/**
 * usePageTransition
 *
 * Hook for accessing page transition utilities.
 *
 * @example
 * ```tsx
 * const { variants, reducedMotion, enterTransition } = usePageTransition('slideUp');
 *
 * return (
 *   <motion.div
 *     variants={variants}
 *     initial="initial"
 *     animate="animate"
 *     transition={enterTransition}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export declare function usePageTransition(variant?: PageTransitionVariant): {
    variants: Variants;
    reducedMotion: boolean;
    enterTransition: import("framer-motion").Transition;
    exitTransition: import("framer-motion").Transition;
};
//# sourceMappingURL=PageTransition.d.ts.map