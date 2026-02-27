/**
 * TemplateCard Component
 *
 * Shared card component for displaying firewall templates.
 * Used by both Desktop and Mobile presenters.
 */

import * as React from 'react';

import { Badge, Button, Card, cn } from '@nasnet/ui/primitives';

import type { FirewallTemplate, TemplateCategory, TemplateComplexity } from './types';

export interface TemplateCardProps {
  /** Template to display */
  template: FirewallTemplate;

  /** Whether this card is selected */
  isSelected?: boolean;

  /** Click handler for the card */
  onClick?: () => void;

  /** Optional action button */
  onAction?: () => void;

  /** Action button label */
  actionLabel?: string;

  /** Container className */
  className?: string;

  /** Card variant (default or compact) */
  variant?: 'default' | 'compact';
}

/**
 * Get complexity badge variant
 */
function getComplexityVariant(complexity: TemplateComplexity): 'default' | 'secondary' | 'error' {
  switch (complexity) {
    case 'SIMPLE':
      return 'secondary';
    case 'MODERATE':
      return 'default';
    case 'ADVANCED':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Get category badge label
 */
function getCategoryLabel(category: TemplateCategory): string {
  switch (category) {
    case 'BASIC':
      return 'Basic Security';
    case 'HOME':
      return 'Home Network';
    case 'GAMING':
      return 'Gaming';
    case 'IOT':
      return 'IoT Isolation';
    case 'GUEST':
      return 'Guest Network';
    case 'CUSTOM':
      return 'Custom';
    default:
      return category;
  }
}

/**
 * Get complexity label
 */
function getComplexityLabel(complexity: TemplateComplexity): string {
  switch (complexity) {
    case 'SIMPLE':
      return 'Simple';
    case 'MODERATE':
      return 'Moderate';
    case 'ADVANCED':
      return 'Advanced';
    default:
      return complexity;
  }
}

/**
 * Template card for gallery display
 *
 * Features:
 * - Template name, description, category, and complexity
 * - Rule count indicator
 * - Built-in badge
 * - Selectable with visual feedback
 * - Optional action button
 * - Compact variant for mobile
 */
export function TemplateCard({
  template,
  isSelected = false,
  onClick,
  onAction,
  actionLabel = 'Apply',
  className,
  variant = 'default',
}: TemplateCardProps) {
  const isCompact = variant === 'compact';

  return (
    <Card
      className={cn(
        'bg-card border-border rounded-[var(--semantic-radius-card)] border',
        'shadow-[var(--semantic-shadow-card)]',
        'cursor-pointer transition-shadow duration-200 hover:shadow-lg',
        isSelected && 'ring-primary ring-2',
        isCompact ? 'p-component-sm' : 'p-component-md',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="gap-component-sm mb-component-sm flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'text-foreground truncate font-semibold',
              isCompact ? 'text-sm' : 'font-display text-lg'
            )}
          >
            {template.name}
          </h3>
        </div>

        {/* Built-in badge */}
        {template.isBuiltIn && (
          <Badge
            variant="outline"
            className={cn(
              'rounded-[var(--semantic-radius-badge)]',
              isCompact && 'px-component-sm text-xs'
            )}
          >
            Built-in
          </Badge>
        )}
      </div>

      {/* Description */}
      <p
        className={cn(
          'text-muted-foreground mb-component-md',
          isCompact ? 'line-clamp-2 text-xs' : 'line-clamp-2 text-sm'
        )}
      >
        {template.description}
      </p>

      {/* Metadata badges */}
      <div className="gap-component-sm mb-component-md flex flex-wrap">
        {/* Category */}
        <Badge
          variant="secondary"
          className={cn('rounded-[var(--semantic-radius-badge)]', isCompact && 'text-xs')}
        >
          {getCategoryLabel(template.category)}
        </Badge>

        {/* Complexity */}
        <Badge
          variant={getComplexityVariant(template.complexity)}
          className={cn('rounded-[var(--semantic-radius-badge)]', isCompact && 'text-xs')}
        >
          {getComplexityLabel(template.complexity)}
        </Badge>

        {/* Rule count */}
        <Badge
          variant="outline"
          className={cn('rounded-[var(--semantic-radius-badge)]', isCompact && 'text-xs')}
        >
          {template.ruleCount} {template.ruleCount === 1 ? 'rule' : 'rules'}
        </Badge>
      </div>

      {/* Variables count */}
      {template.variables.length > 0 && (
        <div className={cn('text-muted-foreground mb-component-md text-xs')}>
          Requires {template.variables.length}{' '}
          {template.variables.length === 1 ? 'variable' : 'variables'}
        </div>
      )}

      {/* Action button */}
      {onAction && (
        <Button
          size={isCompact ? 'sm' : 'default'}
          className="min-h-[44px] w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
        >
          {actionLabel}
        </Button>
      )}

      {/* Updated timestamp (custom templates only) */}
      {!template.isBuiltIn && template.updatedAt && (
        <div className="text-muted-foreground mt-component-sm text-xs">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </div>
      )}
    </Card>
  );
}
