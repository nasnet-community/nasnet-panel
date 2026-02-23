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
function ResourceCardMobileComponent<T extends BaseResource>(
  props: ResourceCardProps<T>
) {
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
      className={cn('p-4 touch-manipulation', className)}
      onClick={handleClick}
      role="article"
      aria-label={`${resource.name} - ${statusLabel}`}
    >
      <CardContent className="p-0 space-y-3">
        {/* Header row with status */}
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Status indicator with optional pulse */}
            <div className="relative shrink-0">
              <Badge variant={statusColor} className="min-h-[28px]">
                {statusLabel}
              </Badge>
              {isOnline && showLivePulse && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Resource name */}
            <span className="font-medium truncate">{resource.name}</span>
          </div>
        </div>

        {/* Description if present */}
        {resource.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Custom content */}
        {children}

        {/* Primary action as full-width button */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            size="lg"
            className="w-full min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              handlePrimaryAction();
            }}
            disabled={primaryAction.disabled}
            aria-label={primaryAction.label}
          >
            {primaryAction.icon && (
              <span className="mr-2" aria-hidden="true">
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
