/**
 * ResourceCard Tablet Presenter
 *
 * Tablet-optimized presenter for ResourceCard pattern.
 * Hybrid approach between mobile and desktop with balanced information density.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { MoreHorizontal } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  cn,
} from '@nasnet/ui/primitives';

import { useResourceCard } from './useResourceCard';

import type { BaseResource, ResourceCardProps } from './types';

/**
 * Tablet presenter for ResourceCard
 *
 * Features:
 * - Touch targets 38-44px for both touch and mouse input
 * - Balanced information density with optional collapsible details
 * - Secondary actions in dropdown (like desktop) or expandable (mobile-style)
 * - Support for both portrait and landscape orientations
 */
function ResourceCardTabletComponent<T extends BaseResource>(props: ResourceCardProps<T>) {
  const { resource, className, children, showLivePulse = true } = props;
  const {
    status,
    isOnline,
    statusColor,
    statusLabel,
    primaryAction,
    secondaryActions,
    hasActions,
    handleClick,
    handlePrimaryAction,
  } = useResourceCard(props);

  return (
    <Card
      className={cn(
        'touch-manipulation p-5 transition-shadow duration-200',
        'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={handleClick}
      role="article"
      aria-label={`${resource.name} - ${statusLabel}`}
    >
      <CardContent className="space-y-3 p-0">
        {/* Header: Status and info */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status indicator */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Status indicator with optional pulse */}
            <div className="relative flex-shrink-0">
              <Badge
                variant={statusColor}
                className="min-h-[40px]"
              >
                {statusLabel}
              </Badge>
              {isOnline && showLivePulse && (
                <span
                  className="bg-success absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Resource info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-foreground truncate text-lg font-semibold">{resource.name}</h3>
              {resource.description && (
                <p className="text-muted-foreground truncate text-sm">{resource.description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions dropdown */}
          {hasActions && (
            <div
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Single action button or dropdown */}
              {secondaryActions.length === 0 && primaryAction ?
                <Button
                  variant={primaryAction.variant || 'default'}
                  size="sm"
                  className="min-h-[40px]"
                  onClick={handlePrimaryAction}
                  disabled={primaryAction.disabled}
                  aria-label={primaryAction.label}
                >
                  {primaryAction.icon && (
                    <span
                      className="mr-1.5"
                      aria-hidden="true"
                    >
                      {primaryAction.icon}
                    </span>
                  )}
                  {primaryAction.label}
                </Button>
              : <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[40px] min-w-[40px]"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {primaryAction && (
                      <DropdownMenuItem
                        onClick={handlePrimaryAction}
                        disabled={primaryAction.disabled}
                        className="min-h-[40px]"
                      >
                        {primaryAction.icon && (
                          <span
                            className="mr-2"
                            aria-hidden="true"
                          >
                            {primaryAction.icon}
                          </span>
                        )}
                        {primaryAction.label}
                      </DropdownMenuItem>
                    )}
                    {secondaryActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                          'min-h-[40px]',
                          action.variant === 'destructive' ? 'text-destructive' : ''
                        )}
                      >
                        {action.icon && (
                          <span
                            className="mr-2"
                            aria-hidden="true"
                          >
                            {action.icon}
                          </span>
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            </div>
          )}
        </div>

        {/* Custom content */}
        {children && <div className="text-sm">{children}</div>}
      </CardContent>
    </Card>
  );
}

ResourceCardTabletComponent.displayName = 'ResourceCardTablet';

export const ResourceCardTablet = React.memo(
  ResourceCardTabletComponent
) as typeof ResourceCardTabletComponent;
