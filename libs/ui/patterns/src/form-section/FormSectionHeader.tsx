/**
 * FormSectionHeader Component
 *
 * Header component for FormSection with title, description, help icon, and collapse toggle.
 * Supports both collapsible and non-collapsible modes with proper accessibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';

import { ChevronDown, HelpCircle } from 'lucide-react';

import {
  cn,
  Badge,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@nasnet/ui/primitives';

import type { FormSectionHeaderProps } from './form-section.types';

/**
 * FormSectionHeader renders the header area of a form section.
 *
 * Features:
 * - Title and optional description
 * - Collapsible toggle with animated chevron
 * - Error count badge
 * - Help icon with tooltip
 * - Full keyboard accessibility
 * - Mobile-friendly tap targets (44px minimum)
 *
 * @example
 * ```tsx
 * <FormSectionHeader
 *   title="Network Settings"
 *   description="Configure your network connection"
 *   isCollapsible={true}
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   errorCount={2}
 *   headingId="section-heading-network"
 *   contentId="section-content-network"
 *   reducedMotion={false}
 * />
 * ```
 */
export function FormSectionHeader({
  title,
  description,
  isCollapsible,
  isExpanded,
  onToggle,
  helpId,
  errorCount = 0,
  headingId,
  contentId,
  reducedMotion,
}: FormSectionHeaderProps) {
  // Common header content (shared between collapsible and non-collapsible)
  const headerContent = (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Title */}
        <h3 className="text-lg font-semibold font-display text-foreground">
          {title}
        </h3>

        {/* Error count badge */}
        {errorCount > 0 && (
          <Badge
            variant="error"
            className="text-xs rounded-full bg-error/15 text-error border-error/30"
          >
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </Badge>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );

  // Help icon (with tooltip on desktop, tap on mobile)
  const helpIcon = helpId && (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              'h-8 w-8 rounded-full',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
              'transition-colors duration-200'
            )}
            aria-label={`Help for ${title}`}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Click for more information about {title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Collapsible header is a button
  if (isCollapsible) {
    return (
      <button
        type="button"
        id={headingId}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={cn(
          'w-full flex items-center justify-between gap-3',
          'text-left',
          'cursor-pointer',
          'transition-colors duration-150',
          'hover:text-foreground',
          // Focus ring
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        {/* Chevron icon */}
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0',
            'text-muted-foreground',
            // Only apply transition if reduced motion is not preferred
            !reducedMotion && 'transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />

        {headerContent}

        {/* Help icon */}
        {helpIcon && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              // Prevent toggle when interacting with help button
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
          >
            {helpIcon}
          </div>
        )}
      </button>
    );
  }

  // Non-collapsible header is a static div
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3'
      )}
    >
      {headerContent}
      {helpIcon}
    </div>
  );
}
