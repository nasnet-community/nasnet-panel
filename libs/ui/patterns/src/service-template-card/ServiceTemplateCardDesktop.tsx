/**
 * ServiceTemplateCard Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceTemplateCard pattern.
 * Horizontal layout with hover states and inline actions.
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';

import { useServiceTemplateCard } from './useServiceTemplateCard';

import type { ServiceTemplateCardProps } from './types';

/**
 * Desktop presenter for ServiceTemplateCard
 *
 * Features:
 * - Compact horizontal layout
 * - Hover states and transitions
 * - Secondary actions in dropdown menu
 * - Tooltip on description truncation
 * - Inline metadata display
 */
function ServiceTemplateCardDesktopComponent(props: ServiceTemplateCardProps) {
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
      className={`bg-card border-border cursor-pointer rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)] transition-shadow duration-200 hover:shadow-lg ${className || ''} `.trim()}
      onClick={handleClick}
      role="article"
      aria-label={`${name} template - ${scopeColors.label}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Template icon */}
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center text-2xl">
              {typeof icon === 'string' ?
                <span
                  role="img"
                  aria-hidden="true"
                >
                  {icon}
                </span>
              : icon}
            </div>
          )}

          {/* Template info */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <h3 className="text-foreground truncate text-lg font-semibold">
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

              {version && (
                <span className="text-muted-foreground shrink-0 font-mono text-xs">v{version}</span>
              )}

              {/* Scope badge */}
              <Badge
                variant="outline"
                className={`${scopeColors.bg} ${scopeColors.text} shrink-0 rounded-[var(--semantic-radius-badge)] border-0`}
              >
                {scopeColors.label}
              </Badge>
            </div>

            {/* Category and description row */}
            <div className="flex items-center gap-2">
              <span className={`shrink-0 text-xs font-medium ${categoryColor}`}>
                {props.template.category.charAt(0).toUpperCase() + props.template.category.slice(1)}
              </span>

              {description && (
                <>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span
                    className="text-muted-foreground line-clamp-2 text-sm"
                    title={description.length > 60 ? description : undefined}
                  >
                    {description}
                  </span>
                </>
              )}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-xs">
              {/* Service count */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Services:</span>
                <span className="font-medium">{serviceCount}</span>
              </div>

              {/* Variables */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Config:</span>
                <span className="font-medium">{formattedVariableCount}</span>
              </div>

              {/* Size */}
              {sizeEstimate && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{sizeEstimate}</span>
                </div>
              )}

              {/* Updated */}
              {updatedAt && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">{updatedAt}</span>
                </div>
              )}

              {/* Shared template metadata */}
              {hasMetadata && (
                <>
                  <span className="text-muted-foreground">•</span>
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
                      <span
                        className="text-amber-500"
                        aria-hidden="true"
                      >
                        ★
                      </span>
                      <span className="font-medium">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Custom content */}
            {children}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Primary action */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                size="default"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrimaryAction();
                }}
                disabled={primaryAction.disabled || primaryAction.loading}
                aria-label={primaryAction.label}
              >
                {primaryAction.loading ?
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {primaryAction.label}
                  </span>
                : <>
                    {primaryAction.icon && (
                      <span
                        className="mr-2"
                        aria-hidden="true"
                      >
                        {primaryAction.icon}
                      </span>
                    )}
                    {primaryAction.label}
                  </>
                }
              </Button>
            )}

            {/* Secondary actions in dropdown */}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="1"
                      />
                      <circle
                        cx="12"
                        cy="5"
                        r="1"
                      />
                      <circle
                        cx="12"
                        cy="19"
                        r="1"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {secondaryActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      disabled={action.disabled || action.loading}
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
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap with memo for performance optimization
export const ServiceTemplateCardDesktop = memo(ServiceTemplateCardDesktopComponent);

// Set display name for React DevTools
ServiceTemplateCardDesktop.displayName = 'ServiceTemplateCardDesktop';
