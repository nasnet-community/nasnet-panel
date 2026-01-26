import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
}

export interface BottomNavigationProps {
  items: NavigationItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(
  ({ items, activeId, onItemClick, className }, ref) => {
    const handleItemClick = (item: NavigationItem) => {
      if (item.onClick) {
        item.onClick();
      }
      if (onItemClick) {
        onItemClick(item.id);
      }
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'surface border-t border-default shadow-lg',
          'safe-bottom',
          'md:hidden', // Only show on mobile
          className
        )}
      >
        <div className="flex items-center justify-around h-16">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 flex-1',
                  'transition-colors duration-200 ease-in-out',
                  'relative',
                  isActive
                    ? 'text-primary-500'
                    : 'text-muted hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />
                )}
                
                {/* Icon with badge */}
                <div className="relative">
                  <div className={cn('text-xl', isActive && 'scale-110 transition-transform')}>
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium transition-all duration-200',
                    isActive ? 'font-semibold' : 'font-normal'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = 'BottomNavigation';

export { BottomNavigation };




























