/**
 * SkipLinks Component
 * Provides skip navigation links for keyboard and screen reader users
 *
 * Features:
 * - Visually hidden by default, visible on focus
 * - Allows keyboard users to skip to main content or navigation
 * - WCAG 2.1 AAA compliant
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */
/**
 * Skip link target configuration
 */
export interface SkipLinkTarget {
    /**
     * The href attribute (e.g., "#main-content")
     */
    href: string;
    /**
     * The visible label for the link
     */
    label: string;
}
/**
 * Props for SkipLinks component
 */
export interface SkipLinksProps {
    /**
     * Custom skip link targets
     * Defaults to "Skip to main content" and "Skip to navigation"
     */
    links?: SkipLinkTarget[];
    /**
     * Additional CSS classes to apply
     */
    className?: string;
}
/**
 * SkipLinks Component
 *
 * Renders skip navigation links that are visually hidden but accessible
 * to keyboard and screen reader users. Links become visible when focused.
 *
 * Usage:
 * 1. Add SkipLinks at the very beginning of your page layout
 * 2. Add corresponding id attributes to your main content and navigation
 *
 * @example
 * ```tsx
 * // In your layout component
 * function AppLayout({ children }) {
 *   return (
 *     <>
 *       <SkipLinks />
 *       <nav id="navigation">...</nav>
 *       <main id="main-content">{children}</main>
 *     </>
 *   );
 * }
 *
 * // With custom links
 * <SkipLinks
 *   links={[
 *     { href: '#main', label: 'Skip to main content' },
 *     { href: '#sidebar', label: 'Skip to sidebar' },
 *     { href: '#footer', label: 'Skip to footer' },
 *   ]}
 * />
 * ```
 *
 * Styling:
 * - Links are positioned absolutely at the top-left
 * - Hidden by default using CSS (position off-screen)
 * - Visible when focused, with high-contrast styling
 * - Stacks vertically when multiple links are focused in sequence
 *
 * Accessibility:
 * - First focusable elements on the page
 * - Clear, descriptive link text
 * - High contrast visible state
 * - Proper focus management
 */
declare function SkipLinks({ links, className }: SkipLinksProps): import("react/jsx-runtime").JSX.Element;
declare namespace SkipLinks {
    var displayName: string;
}
/**
 * A single skip link component for more granular usage
 */
export interface SkipLinkProps {
    /**
     * The href attribute (e.g., "#main-content")
     */
    href: string;
    /**
     * The visible label for the link
     */
    children: React.ReactNode;
    /**
     * Additional CSS classes to apply
     */
    className?: string;
}
/**
 * Individual skip link for custom layouts
 *
 * @example
 * ```tsx
 * <SkipLink href="#main">Skip to main</SkipLink>
 * ```
 */
declare function SkipLink({ href, children, className }: SkipLinkProps): import("react/jsx-runtime").JSX.Element;
declare namespace SkipLink {
    var displayName: string;
}
export { SkipLinks, SkipLink };
//# sourceMappingURL=skip-links.d.ts.map