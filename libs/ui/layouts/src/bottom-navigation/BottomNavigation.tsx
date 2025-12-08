/**
 * Bottom Navigation Component
 * Mobile-first fixed bottom navigation bar
 * Based on UX Design Specification - Mobile-first navigation pattern
 */

import * as React from 'react';
import { Home, Shield, Activity, Settings, LucideIcon } from 'lucide-react';
import { cn } from '@nasnet/ui/primitives';

/**
 * Navigation item configuration
 */
export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: LucideIcon;
  /** Navigation path or click handler */
  href?: string;
  onClick?: () => void;
  /** Optional badge count */
  badge?: number;
}

/**
 * BottomNavigation Props
 */
export interface BottomNavigationProps {
  /** Active navigation item ID */
  activeId: string;
  /** Navigation items (typically 4-5 items) */
  items?: NavItem[];
  /** Custom className */
  className?: string;
}

/**
 * Default navigation items
 */
const defaultItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'vpn',
    label: 'VPN',
    icon: Shield,
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: Activity,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

/**
 * BottomNavigation Component
 * Fixed bottom navigation bar for mobile-first design
 * Features:
 * - Thumb-accessible position
 * - Active state with primary color indicator
 * - Optional badges
 * - Smooth transitions
 */
export function BottomNavigation({
  activeId,
  items = defaultItems,
  className = '',
}: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white dark:bg-slate-800',
        'border-t border-slate-200 dark:border-slate-700',
        'shadow-lg',
        'md:hidden', // Hide on larger screens
        'safe-bottom', // Account for device notches
        className
      )}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;

          const content = (
            <>
              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-error text-white text-xs font-medium">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {/* Icon */}
              <Icon
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                  isActive ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'
                )}
                aria-hidden="true"
              />

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isActive ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {item.label}
              </span>

              {/* Active indicator - bottom border style matching design */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </>
          );

          const commonClasses = cn(
            'relative flex flex-col items-center justify-center gap-1',
            'flex-1 h-full',
            'transition-all duration-200',
            'active:scale-95',
            !isActive && 'hover:text-slate-600 dark:hover:text-slate-300'
          );

          // Render as button or link depending on props
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
              aria-label={item.label}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

