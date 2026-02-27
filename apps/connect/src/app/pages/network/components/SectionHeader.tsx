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
    <div className={cn('py-component-sm flex items-center justify-between', className)}>
      <div className="gap-component-md flex items-center">
        {isCollapsible && (
          <button
            onClick={onToggle}
            className="hover:bg-muted focus-visible:ring-ring -ml-1 flex h-11 w-11 items-center justify-center rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {isCollapsed ?
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            : <ChevronDown className="text-muted-foreground h-4 w-4" />}
          </button>
        )}

        {icon && (
          <span
            className="text-muted-foreground"
            aria-hidden={true}
          >
            {icon}
          </span>
        )}

        <div>
          <div className="gap-component-sm flex items-center">
            <h3 className="text-foreground font-display text-sm font-semibold uppercase tracking-wide">
              {title}
            </h3>
            {count !== undefined && (
              <span className="px-component-sm bg-muted text-muted-foreground rounded-full py-0.5 text-xs font-medium">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
        </div>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="text-primary hover:text-primary/90 focus-visible:ring-ring rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
