/**
 * Quick Actions Card Component
 * 2x2 grid of action buttons for quick access to common features
 * Based on UX Design Specification - Direction 4: Action-First
 */

import * as React from 'react';

import { type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@nasnet/ui/primitives';

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
 * Displays a floating card with 2x2 action grid
 * Follows Action-First design with large touch targets
 */
export function QuickActionsCard({
  actions,
  title = 'Quick Actions',
  className = '',
}: QuickActionsCardProps) {
  return (
    <Card className={`shadow-xl bg-card ${className}`}>
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
                onClick={action.disabled ? undefined : action.onClick}
                disabled={action.disabled}
                className={`
                  rounded-2xl p-4 text-left transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                  ${isPrimary
                    ? 'bg-success hover:bg-success-dark text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span 
                  className={`text-2xl mb-2 block ${isPrimary ? '' : ''}`}
                  aria-hidden="true"
                >
                  <Icon className="w-7 h-7" />
                </span>
                <p className="font-semibold">{action.label}</p>
                {action.sublabel && (
                  <p className={`text-sm ${isPrimary ? 'text-white/80' : 'text-muted-foreground'}`}>
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




























