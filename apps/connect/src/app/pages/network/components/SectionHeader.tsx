/**
 * Section Header Component
 * Reusable collapsible section header with badges and actions
 */

import { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function SectionHeader({
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
            className="p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
        
        {icon && (
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
              {title}
            </h3>
            {count !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                {count}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
}





