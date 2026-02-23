/**
 * Quick Actions Card Component
 *
 * 2x2 grid of action buttons for quick access to common features.
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @module @nasnet/ui/patterns/quick-actions-card
 */

import * as React from 'react';
import { type LucideIcon } from 'lucide-react';

import { Card, CardContent, cn } from '@nasnet/ui/primitives';

/**
 * Quick action item configuration
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Button label */
  label: string;
  /** Sublabel/description */
  sublabel?: string;
  /** Click handler */
  onClick: () => void;
  /** Variant: primary (highlighted), default (normal) */
  variant?: 'primary' | 'default';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * QuickActionsCard Props
 */
export interface QuickActionsCardProps {
  /** Array of quick actions (typically 4 for 2x2 grid) */
  actions: QuickAction[];
  /** Optional title above the actions */
  title?: string;
  /** Custom className */
  className?: string;
}

/**
 * QuickActionsCard Component
 *
 * Displays a floating card with 2x2 action grid.
 * Follows Action-First design with large touch targets.
 *
 * Features:
 * - 2x2 grid layout
 * - Primary (success) and default variants
 * - 44px minimum touch targets
 * - Optional sublabels
 * - Semantic color tokens
 * - WCAG AAA accessible
 *
 * @example
 * ```tsx
 * <QuickActionsCard
 *   title="Quick Actions"
 *   actions={[
 *     {
 *       id: 'connect',
 *       icon: Power,
 *       label: 'Connect',
 *       sublabel: 'Start session',
 *       onClick: () => handleConnect(),
 *       variant: 'primary',
 *     },
 *     {
 *       id: 'network',
 *       icon: Wifi,
 *       label: 'Network',
 *       sublabel: 'Interfaces',
 *       onClick: () => navigate('/network'),
 *     },
 *   ]}
 * />
 * ```
 */
const QuickActionsCardComponent = React.forwardRef<
  HTMLDivElement,
  QuickActionsCardProps
>(
  ({ actions, title = 'Quick Actions', className }, ref) => {
    const handleActionClick = React.useCallback(
      (action: QuickAction) => {
        if (!action.disabled) {
          action.onClick();
        }
      },
      []
    );

    return (
      <Card ref={ref} className={cn('shadow-lg', className)}>
        <CardContent className="p-6">
          {title && (
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {title}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const isPrimary = action.variant === 'primary';

              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  type="button"
                  className={cn(
                    'relative',
                    'rounded-lg p-4 text-left',
                    'min-h-[44px] min-w-[44px]',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    // Variant styles
                    isPrimary
                      ? 'bg-success hover:bg-success/90 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground',
                    // Disabled state
                    action.disabled && 'opacity-50 cursor-not-allowed',
                    !action.disabled && 'cursor-pointer active:scale-95'
                  )}
                  aria-label={action.label}
                  aria-disabled={action.disabled}
                >
                  <span className="text-2xl mb-2 block" aria-hidden="true">
                    <Icon className="w-7 h-7" />
                  </span>
                  <p className="font-semibold text-sm">{action.label}</p>
                  {action.sublabel && (
                    <p
                      className={cn(
                        'text-xs',
                        isPrimary ? 'text-white/80' : 'text-muted-foreground'
                      )}
                    >
                      {action.sublabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }
);

QuickActionsCardComponent.displayName = 'QuickActionsCard';

export const QuickActionsCard = React.memo(QuickActionsCardComponent);




























