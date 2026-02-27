/**
 * ServiceTemplateCard Mobile Presenter
 *
 * Mobile/Tablet-optimized presenter for ServiceTemplateCard pattern.
 * Vertical layout with large touch targets and bottom-aligned actions.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { memo } from 'react';
import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
} from '@nasnet/ui/primitives';

import { useServiceTemplateCard } from './useServiceTemplateCard';

import type { ServiceTemplateCardProps } from './types';

/**
 * Mobile presenter for ServiceTemplateCard
 *
 * Features:
 * - Vertical layout optimized for narrow screens
 * - 44px minimum touch targets
 * - Bottom-aligned action buttons
 * - Truncated descriptions with ellipsis
 * - Prominent scope badge
 */
function ServiceTemplateCardMobileComponent(props: ServiceTemplateCardProps) {
  const { className, children } = props;
  const {
    name,
    description,
    icon,
    verified,
    scopeColors,
    categoryColor,
    serviceCount,
    formattedVariableCount,
    author,
    formattedDownloads,
    rating,
    updatedAt,
    version,
    sizeEstimate,
    primaryAction,
    secondaryActions,
    hasMetadata,
    handleClick,
    handlePrimaryAction,
  } = useServiceTemplateCard(props);

  return (
    <Card
      className={`
        bg-card border border-border rounded-[var(--semantic-radius-card)]
        shadow-[var(--semantic-shadow-card)]
        hover:shadow-lg cursor-pointer
        transition-shadow duration-200
        min-h-[44px]
        ${className || ''}
      `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${name} template - ${scopeColors.label}`}
    >
      <CardHeader className="pb-3 p-4">
        <div className="flex items-start gap-3">
          {/* Template icon */}
          {icon && (
            <div className="shrink-0 w-12 h-12 flex items-center justify-center text-2xl">
              {typeof icon === 'string' ? (
                <span role="img" aria-hidden="true">
                  {icon}
                </span>
              ) : (
                icon
              )}
            </div>
          )}

          {/* Title and scope badge */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">
                {name}
                {verified && (
                  <span
                    className="ml-1.5 inline-block text-blue-500"
                    aria-label="Verified"
                    title="Verified template"
                  >
                    ✓
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Scope badge */}
              <Badge
                variant="outline"
                className={`${scopeColors.bg} ${scopeColors.text} border-0 rounded-[var(--semantic-radius-badge)]`}
              >
                {scopeColors.label}
              </Badge>

              {/* Version */}
              {version && (
                <span className="text-xs font-mono text-muted-foreground">
                  v{version}
                </span>
              )}

              {/* Category */}
              <span className={`text-xs font-medium ${categoryColor}`}>
                {props.template.category.charAt(0).toUpperCase() +
                  props.template.category.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Service count */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Services</span>
            <span className="font-medium">{serviceCount}</span>
          </div>

          {/* Variables */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Config</span>
            <span className="font-medium text-xs">{formattedVariableCount}</span>
          </div>

          {/* Size estimate */}
          {sizeEstimate && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Size</span>
              <span className="font-medium text-xs">{sizeEstimate}</span>
            </div>
          )}

          {/* Updated */}
          {updatedAt && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Updated</span>
              <span className="font-medium text-xs">{updatedAt}</span>
            </div>
          )}
        </div>

        {/* Shared template metadata */}
        {hasMetadata && (
          <div className="flex items-center gap-4 text-xs pt-2 border-t">
            {author && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">By</span>
                <span className="font-medium">{author}</span>
              </div>
            )}
            {formattedDownloads && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">↓</span>
                <span className="font-medium">{formattedDownloads}</span>
              </div>
            )}
            {rating !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-amber-500" aria-hidden="true">
                  ★
                </span>
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Custom content */}
        {children}

        {/* Actions */}
        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex flex-col gap-2 pt-2">
            {/* Primary action (full-width, 44px height) */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size="lg"
                className="w-full h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrimaryAction();
                }}
                disabled={primaryAction.disabled || primaryAction.loading}
                aria-label={primaryAction.label}
              >
                {primaryAction.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {primaryAction.label}
                  </span>
                ) : (
                  <>
                    {primaryAction.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {primaryAction.icon}
                      </span>
                    )}
                    {primaryAction.label}
                  </>
                )}
              </Button>
            )}

            {/* Secondary actions (horizontal row, 44px height) */}
            {secondaryActions.length > 0 && (
              <div className="flex gap-2">
                {secondaryActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="lg"
                    className="flex-1 h-11"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    disabled={action.disabled || action.loading}
                    aria-label={action.label}
                  >
                    {action.loading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {action.icon && (
                          <span className="mr-2" aria-hidden="true">
                            {action.icon}
                          </span>
                        )}
                        <span className="truncate">{action.label}</span>
                      </>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Wrap with memo for performance optimization
export const ServiceTemplateCardMobile = memo(ServiceTemplateCardMobileComponent);

// Set display name for React DevTools
ServiceTemplateCardMobile.displayName = 'ServiceTemplateCardMobile';
