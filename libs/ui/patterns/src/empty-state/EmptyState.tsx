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
        'bg-card border border-border rounded-2xl md:rounded-3xl p-12 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
        <Icon icon={icon} size="xl" className="text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'action'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
