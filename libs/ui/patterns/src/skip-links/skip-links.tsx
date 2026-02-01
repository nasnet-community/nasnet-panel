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

import { cn } from '@nasnet/ui/primitives';

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
 * Default skip link targets
 */
const defaultLinks: SkipLinkTarget[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
];

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
export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  return (
    <div
      className={cn(
        // Container styling
        'fixed top-0 left-0 z-[9999] flex flex-col gap-2 p-4',
        className
      )}
      role="navigation"
      aria-label="Skip links"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            // Visually hidden by default
            'absolute -translate-y-full opacity-0',
            'pointer-events-none',
            // Transition for smooth appearance
            'transition-all duration-150',
            // Visible when focused
            'focus:static focus:translate-y-0 focus:opacity-100',
            'focus:pointer-events-auto',
            // Visual styling
            'rounded-lg bg-primary px-4 py-3',
            'text-sm font-semibold text-primary-foreground',
            'shadow-lg',
            // Focus ring
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'focus:ring-offset-background',
            // Hover state (when visible)
            'hover:bg-primary/90',
            // Touch target
            'min-h-[44px] min-w-[44px]',
            'flex items-center justify-center'
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
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
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Screen reader only by default
        'sr-only',
        // Visible when focused
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        // Visual styling
        'focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3',
        'focus:text-sm focus:font-semibold focus:text-primary-foreground',
        'focus:shadow-lg',
        // Focus ring
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:ring-offset-background',
        // Touch target
        'focus:min-h-[44px] focus:min-w-[44px]',
        'focus:flex focus:items-center focus:justify-center',
        className
      )}
    >
      {children}
    </a>
  );
}
