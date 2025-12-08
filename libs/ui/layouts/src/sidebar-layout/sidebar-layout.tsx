import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarWidth?: string;
  sidebarPosition?: 'left' | 'right';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-6',
};

const SidebarLayout = React.forwardRef<HTMLDivElement, SidebarLayoutProps>(
  (
    {
      children,
      sidebar,
      sidebarWidth = '16rem',
      sidebarPosition = 'left',
      gap = 'md',
      className,
    },
    ref
  ) => {
    const sidebarElement = (
      <aside
        className="shrink-0 surface-secondary border-default transition-all duration-200 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>
    );

    return (
      <div
        ref={ref}
        className={cn('flex flex-col md:flex-row', gapClasses[gap], className)}
      >
        {sidebarPosition === 'left' && sidebarElement}
        <div className="min-w-0 flex-1">{children}</div>
        {sidebarPosition === 'right' && sidebarElement}
      </div>
    );
  }
);

SidebarLayout.displayName = 'SidebarLayout';

export { SidebarLayout };
