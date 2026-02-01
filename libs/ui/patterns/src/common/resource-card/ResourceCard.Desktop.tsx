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
export function ResourceCardDesktop<T extends BaseResource>(
  props: ResourceCardProps<T>
) {
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
      className={`
        p-4 transition-colors hover:bg-muted/50 cursor-pointer
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${resource.name} - ${statusLabel}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Status and info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Status indicator with optional pulse */}
            <div className="relative flex-shrink-0">
              <Badge variant={statusColor}>
                {statusLabel}
              </Badge>
              {isOnline && showLivePulse && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Resource info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{resource.name}</h3>
              {resource.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {resource.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {hasActions && (
            <div
              className="flex items-center gap-2 flex-shrink-0"
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
                    <span className="mr-1.5" aria-hidden="true">
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
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action) => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={
                          action.variant === 'destructive'
                            ? 'text-destructive'
                            : ''
                        }
                      >
                        {action.icon && (
                          <span className="mr-2" aria-hidden="true">
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

ResourceCardDesktop.displayName = 'ResourceCardDesktop';
