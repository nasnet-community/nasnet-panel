/**
 * Section Header Component
 * Reusable collapsible section header with badges and actions
 */

import React, { type ReactNode } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

export const SectionHeader = React.memo(function SectionHeader({
  title,
  subtitle,
  count,
  isCollapsed,
  onToggle,
  action,
  icon,
  className,
}: SectionHeaderProps) {
  const isCollapsible = onToggle !== undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-component-sm',
        className
      )}
    >
      <div className="flex items-center gap-component-md">
        {isCollapsible && (
          <button
            onClick={onToggle}
            className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-11 w-11 flex items-center justify-center"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}

        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}

        <div>
          <div className="flex items-center gap-component-sm">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide font-display">
              {title}
            </h3>
            {count !== undefined && (
              <span className="px-component-sm py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                {count}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-medium text-primary hover:text-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';






















