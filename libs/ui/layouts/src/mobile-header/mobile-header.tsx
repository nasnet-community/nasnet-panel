import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface MobileHeaderProps {
  title: string;
  greeting?: string | boolean;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const MobileHeader = React.forwardRef<HTMLElement, MobileHeaderProps>(
  ({ title, greeting, subtitle, actions, className }, ref) => {
    const greetingText = typeof greeting === 'string' ? greeting : greeting ? getGreeting() : null;

    return (
      <header
        ref={ref}
        className={cn(
          'surface border-b border-default',
          'px-4 py-6 md:px-6',
          'safe-top',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {greetingText && (
              <p className="text-sm text-muted mb-1">{greetingText}</p>
            )}
            <h1 className="text-2xl font-display font-semibold tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted mt-1">{subtitle}</p>
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

MobileHeader.displayName = 'MobileHeader';

export { MobileHeader };







