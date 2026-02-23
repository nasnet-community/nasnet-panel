/**
 * Mobile Header Component
 *
 * Responsive page header for mobile and tablet layouts.
 * Displays optional time-based greeting, main title, subtitle, and action buttons.
 * Uses semantic HTML `<header>` element with safe-area support for notched devices (iOS).
 *
 * **Features:**
 * - Responsive typography with semantic font scales
 * - Time-based greeting with auto-detection (morning/afternoon/evening)
 * - Muted secondary text for subtitle and greeting (accessibility-friendly)
 * - Safe-area insets for iOS notched devices (iPhone X, 11, 12, 13, 14+)
 * - Flexible action area in top-right corner
 * - Text truncation for long titles (prevents overflow)
 * - Semantic HTML `<header>` and `<h1>` for accessibility
 * - forwardRef support for parent imperative refs
 * - React.memo for render optimization
 *
 * **Platform Behavior:**
 * - Mobile (<640px): Compact horizontal padding (px-4), vertical padding (py-6)
 * - Tablet/Desktop (640px+): Increased horizontal padding (md:px-6)
 *
 * **When to Use:**
 * - As the top header in app layouts (shells, pages)
 * - Whenever you need time-based greetings ("Good morning")
 * - To display current context (router name, page title)
 * - For responsive page headers with action buttons
 *
 * **Don't Use When:**
 * - You need sub-navigation tabs (use TabNavigation pattern instead)
 * - Building modal or dialog headers (use DialogHeader primitive)
 * - You need breadcrumb navigation (use Breadcrumb pattern)
 *
 * **Accessibility:**
 * - Proper heading hierarchy: h1 for page title
 * - Semantic HTML: `<header>` landmark element
 * - Secondary text uses `text-muted-foreground` with sufficient contrast
 * - Works with screen readers (no hidden content)
 * - Safe-area support ensures content visible on notched devices
 *
 * @example
 * Basic usage with auto-greeting:
 * ```tsx
 * <MobileHeader
 *   title="Dashboard"
 *   greeting={true}
 *   subtitle="MikroTik hEX S"
 * />
 * ```
 *
 * @example
 * With custom greeting and actions:
 * ```tsx
 * <MobileHeader
 *   title="Network"
 *   greeting="Welcome back!"
 *   subtitle="3 interfaces online"
 *   actions={<RefreshButton />}
 * />
 * ```
 *
 * @see {@link MobileHeaderProps} for prop interface
 * @see MobileAppShell for complete layout integration
 */

import * as React from 'react';
import { useMemo } from 'react';

import { cn } from '@nasnet/ui/primitives';

/**
 * MobileHeader component props
 * @interface MobileHeaderProps
 */
export interface MobileHeaderProps {
  /** Main heading text (typically page title) - required, single line recommended */
  title: string;
  /** Greeting text or auto-generate based on time of day. Pass string for custom, true for auto, false/undefined to hide */
  greeting?: string | boolean;
  /** Optional subtitle text (typically context like router name) - rendered below title with muted styling */
  subtitle?: string;
  /** Optional action elements (buttons, menus) rendered in top-right corner */
  actions?: React.ReactNode;
  /** Optional custom className for root element */
  className?: string;
}

/**
 * Get time-based greeting message
 * @internal
 */
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/**
 * MobileHeader - Responsive page header component
 * Provides semantic HTML header with optional greeting, title, subtitle, and actions.
 */
const MobileHeaderImpl = React.forwardRef<HTMLElement, MobileHeaderProps>(
  ({ title, greeting, subtitle, actions, className }, ref) => {
    // Memoize greeting computation
    const greetingText = useMemo(() => {
      if (typeof greeting === 'string') return greeting;
      return greeting ? getGreeting() : null;
    }, [greeting]);

    return (
      <header
        ref={ref}
        className={cn(
          'bg-background border-b border-border',
          'px-4 py-6 md:px-6',
          'pt-[max(1.5rem,_var(--safe-area-inset-top))]', // Account for device notches (iOS safe-area)
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {greetingText && (
              <p className="text-sm text-muted-foreground mb-1">{greetingText}</p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </header>
    );
  }
);

MobileHeaderImpl.displayName = 'MobileHeader';

/**
 * MobileHeader - Page header component for responsive layouts
 */
export const MobileHeader = React.memo(MobileHeaderImpl);

























