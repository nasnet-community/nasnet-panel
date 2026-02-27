/**
 * ResourceCard Desktop Presenter
 *
 * Desktop-optimized presenter for ResourceCard pattern.
 * Optimized for mouse interaction with hover states and dense layout.
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
 * Desktop presenter for ResourceCard
 *
 * Features:
 * - Dense information display
 * - Hover states for interactive feedback
 * - Dropdown menu for secondary actions
 * - Inline primary action button
 */
function ResourceCardDesktopComponent<T extends BaseResource>(props: ResourceCardProps<T>) {
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
        'p-component-lg cursor-pointer transition-shadow duration-200 hover:shadow-lg',
        className
      )}
      onClick={handleClick}
      role="article"
      aria-label={`${resource.name} - ${statusLabel}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status and info */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {/* Status indicator with optional pulse */}
            <div className="relative flex-shrink-0">
              <Badge variant={statusColor}>{statusLabel}</Badge>
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

          {/* Right: Actions */}
          {hasActions && (
            <div
              className="flex flex-shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Primary action */}
              {primaryAction && (
                <Button
                  variant={primaryAction.variant || 'default'}
                  size="sm"
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
              )}

              {/* Secondary actions dropdown */}
              {secondaryActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="More actions"
                    >
                      <Icon
                        icon={MoreHorizontal}
                        size="sm"
                        className="text-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={action.variant === 'destructive' ? 'text-destructive' : ''}
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
              )}
            </div>
          )}
        </div>

        {/* Custom content */}
        {children && <div className="mt-3">{children}</div>}
      </CardContent>
    </Card>
  );
}

ResourceCardDesktopComponent.displayName = 'ResourceCardDesktop';

export const ResourceCardDesktop = React.memo(
  ResourceCardDesktopComponent
) as typeof ResourceCardDesktopComponent;
