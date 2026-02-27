/**
 * Empty State Component
 * Consistent empty state pattern across all pages
 * Based on UX Design Specification - Design Direction 1: Clean Minimal
 */

import * as React from 'react';

import { type LucideIcon } from 'lucide-react';

import { cn, Button, Icon } from '@nasnet/ui/primitives';

/**
 * EmptyState Props
 */
export interface EmptyStateProps {
  /** Icon component */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Description text */
  description: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'action' | 'default' | 'outline';
  };
  /** Custom className */
  className?: string;
}

/**
 * EmptyState Component
 *
 * Displays a consistent empty state with:
 * - Large icon in rounded square background
 * - Clear heading and description
 * - Optional CTA button
 * - Proper spacing and alignment
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Shield}
 *   title="No WireGuard interfaces configured"
 *   description="Your router doesn't have any WireGuard VPN interfaces set up yet."
 *   action={{
 *     label: 'Add VPN',
 *     onClick: () => navigate('/vpn/add'),
 *     variant: 'action'
 *   }}
 * />
 * ```
 */
export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4',
        className
      )}
    >
      {/* Icon */}
      <div className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4">
        <Icon icon={icon} size="xl" />
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'action'}
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
