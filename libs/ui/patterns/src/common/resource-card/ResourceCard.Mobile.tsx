/**
 * ResourceCard Mobile Presenter
 *
 * Mobile-optimized presenter for ResourceCard pattern.
 * Optimized for touch interaction with 44px minimum targets.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { Badge, Button, Card, CardContent, cn } from '@nasnet/ui/primitives';

import { useResourceCard } from './useResourceCard';

import type { BaseResource, ResourceCardProps } from './types';

/**
 * Mobile presenter for ResourceCard
 *
 * Features:
 * - Large touch targets (44px minimum)
 * - Single column layout
 * - Primary action as full-width button
 * - Tap to expand for details
 */
function ResourceCardMobileComponent<T extends BaseResource>(props: ResourceCardProps<T>) {
  const { resource, className, children, showLivePulse = true } = props;
  const {
    status,
    isOnline,
    statusColor,
    statusLabel,
    primaryAction,
    handleClick,
    handlePrimaryAction,
  } = useResourceCard(props);

  return (
    <Card
      className={cn(
        'p-component-md touch-manipulation rounded-[var(--semantic-radius-cardMobile)]',
        className
      )}
      onClick={handleClick}
      role="article"
      aria-label={`${resource.name} - ${statusLabel}`}
    >
      <CardContent className="space-y-3 p-0">
        {/* Header row with status */}
        <div className="flex min-h-[44px] items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Status indicator with optional pulse */}
            <div className="relative shrink-0">
              <Badge
                variant={statusColor}
                className="min-h-[28px]"
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

            {/* Resource name */}
            <span className="truncate font-medium">{resource.name}</span>
          </div>
        </div>

        {/* Description if present */}
        {resource.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{resource.description}</p>
        )}

        {/* Custom content */}
        {children}

        {/* Primary action as full-width button */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            size="lg"
            className="min-h-[44px] w-full"
            onClick={(e) => {
              e.stopPropagation();
              handlePrimaryAction();
            }}
            disabled={primaryAction.disabled}
            aria-label={primaryAction.label}
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
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

ResourceCardMobileComponent.displayName = 'ResourceCardMobile';

export const ResourceCardMobile = React.memo(
  ResourceCardMobileComponent
) as typeof ResourceCardMobileComponent;
