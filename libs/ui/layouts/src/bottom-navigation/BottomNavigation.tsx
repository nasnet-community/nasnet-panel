/**
 * Bottom Navigation Component
 * Mobile-first fixed bottom navigation bar for responsive layouts.
 *
 * Features:
 * - Thumb-accessible position at bottom of screen
 * - Fixed positioning with safe-area support for notched devices
 * - Active state indicator with primary color accent
 * - Optional badge support (typically for notification counts)
 * - 44px minimum touch targets for WCAG AAA compliance
 * - Hidden on desktop (md+ screens) via responsive utilities
 *
 * @example
 * ```tsx
 * <BottomNavigation
 *   activeId="home"
 *   items={[
 *     { id: 'home', label: 'Home', icon: Home, onClick: () => navigate('/') },
 *     { id: 'search', label: 'Search', icon: Search, badge: 2 },
 *   ]}
 * />
 * ```
 *
 * @see {@link NavItem} for navigation item configuration
 * @see {@link BottomNavigationProps} for prop interface
 */

import * as React from 'react';
import { useCallback, useMemo } from 'react';

import { cn, Icon } from '@nasnet/ui/primitives';
import { useReducedMotion } from '@nasnet/core/utils';

/**
 * Navigation item configuration for BottomNavigation
 * @interface NavItem
 */
export interface NavItem {
  /** Unique identifier for this navigation item */
  id: string;
  /** Display label shown below icon */
  label: string;
  /** Icon name (supports 'lucide:name', 'custom:name', 'category:name' prefixes) */
  icon: string;
  /** Optional navigation path (renders as <a> tag) */
  href?: string;
  /** Optional click handler (renders as <button> tag) */
  onClick?: () => void;
  /** Optional badge count (e.g., notification count) */
  badge?: number;
}

/**
 * BottomNavigation component props
 * @interface BottomNavigationProps
 */
export interface BottomNavigationProps {
  /** ID of currently active navigation item */
  activeId: string;
  /** Array of navigation items (typically 4-5 items) */
  items?: NavItem[];
  /** Optional custom className for root element */
  className?: string;
}

/**
 * Default navigation items
 */
const defaultItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'lucide:home',
  },
  {
    id: 'vpn',
    label: 'VPN',
    icon: 'lucide:shield',
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: 'lucide:activity',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'lucide:settings',
  },
];

/**
 * BottomNavigation Component
 *
 * Fixed bottom navigation bar for mobile-first responsive layouts.
 * Hidden on desktop (md+) screens. Provides thumb-accessible navigation
 * with active state indicators and optional badge support.
 */
const BottomNavigationImpl = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ activeId, items = defaultItems, className = '' }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    // Memoized handler to prevent unnecessary re-renders
    const renderNavItem = useCallback(
      (item: NavItem) => {
        const isActive = item.id === activeId;

        const content = (
          <>
            {/* Badge - Error color for notification count */}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-error text-white text-xs font-medium"
                aria-label={`${item.label}: ${item.badge} notifications`}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}

            {/* Icon with semantic color tokens */}
            <Icon
              icon={item.icon as any}
              className={cn(
                'w-6 h-6 transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted'
              )}
              aria-hidden="true"
            />

            {/* Label */}
            <span
              className={cn(
                'text-xs font-medium transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted'
              )}
            >
              {item.label}
            </span>

            {/* Active indicator - bottom accent line */}
            {isActive && (
              <div
                className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full',
                  !prefersReducedMotion && 'animate-in fade-in duration-200'
                )}
                aria-hidden="true"
              />
            )}
          </>
        );

        const commonClasses = cn(
          'relative flex flex-col items-center justify-center gap-1',
          'flex-1 h-full min-h-[44px] min-w-[44px]', // 44px WCAG AAA touch target
          'transition-all duration-200',
          !prefersReducedMotion && 'active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          !isActive && 'hover:text-foreground'
        );

        // Render as link or button depending on props
        if (item.href) {
          return (
            <a
              key={item.id}
              href={item.href}
              className={commonClasses}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </a>
          );
        }

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={commonClasses}
            aria-current={isActive ? 'page' : undefined}
            type="button"
          >
            {content}
          </button>
        );
      },
      [activeId, prefersReducedMotion]
    );

    // Memoize rendered items to prevent unnecessary re-renders
    const renderedItems = useMemo(
      () => items.map((item) => renderNavItem(item)),
      [items, renderNavItem]
    );

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'backdrop-blur-md bg-card/80',
          'border-t border-border',
          'hidden sm:flex md:hidden', // Hide on larger screens
          className
        )}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
          height: 'calc(4rem + max(env(safe-area-inset-bottom), 0px))',
        }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around flex-1">
          {renderedItems}
        </div>
      </nav>
    );
  }
);

BottomNavigationImpl.displayName = 'BottomNavigation';

/**
 * BottomNavigation component - Mobile-first bottom navigation bar
 */
export const BottomNavigation = React.memo(BottomNavigationImpl);

