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
        'flex items-center justify-between py-2',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isCollapsible && (
          <button
            onClick={onToggle}
            className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors"
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {title}
            </h3>
            {count !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
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
          className="text-xs font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';






















