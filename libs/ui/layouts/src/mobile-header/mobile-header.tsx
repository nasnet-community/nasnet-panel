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
 * Basic usage:
 * ```tsx
 * <MobileHeader
 *   title="Dashboard"
 * />
 * ```
 *
 * @example
 * With action buttons:
 * ```tsx
 * <MobileHeader
 *   title="Network"
 *   actions={<RefreshButton />}
 * />
 * ```
 *
 * @see {@link MobileHeaderProps} for prop interface
 * @see MobileAppShell for complete layout integration
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

/**
 * MobileHeader component props
 * @interface MobileHeaderProps
 */
export interface MobileHeaderProps {
  /** Main heading text (typically page title) - required, single line recommended */
  title: string;
  /** Optional action elements (buttons, menus) rendered in top-right corner */
  actions?: React.ReactNode;
  /** Optional custom className for root element */
  className?: string;
}

/**
 * MobileHeader - Responsive page header component
 * Provides semantic HTML header with optional greeting, title, subtitle, and actions.
 */
const MobileHeaderImpl = React.forwardRef<HTMLElement, MobileHeaderProps>(
  ({ title, actions, className }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-40',
          'bg-card/80 h-16 backdrop-blur-md',
          'border-border border-b',
          'px-page-mobile md:px-page-tablet lg:px-page-desktop',
          'pt-safe',
          'flex items-center',
          className
        )}
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground truncate text-lg font-semibold">{title}</h1>
        </div>
        {actions && <div className="ml-4 flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </header>
    );
  }
);

MobileHeaderImpl.displayName = 'MobileHeader';

/**
 * MobileHeader - Page header component for responsive layouts
 */
export const MobileHeader = React.memo(MobileHeaderImpl);
