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
function getComplexityVariant(
  complexity: TemplateComplexity
): 'default' | 'secondary' | 'error' {
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
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-lg',
        isCompact ? 'p-3' : 'p-4',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold truncate',
              isCompact ? 'text-sm' : 'text-base'
            )}
          >
            {template.name}
          </h3>
        </div>

        {/* Built-in badge */}
        {template.isBuiltIn && (
          <Badge variant="outline" className={cn(isCompact && 'text-xs px-1')}>
            Built-in
          </Badge>
        )}
      </div>

      {/* Description */}
      <p
        className={cn(
          'text-muted-foreground mb-3',
          isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
        )}
      >
        {template.description}
      </p>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Category */}
        <Badge variant="secondary" className={cn(isCompact && 'text-xs')}>
          {getCategoryLabel(template.category)}
        </Badge>

        {/* Complexity */}
        <Badge
          variant={getComplexityVariant(template.complexity)}
          className={cn(isCompact && 'text-xs')}
        >
          {getComplexityLabel(template.complexity)}
        </Badge>

        {/* Rule count */}
        <Badge variant="outline" className={cn(isCompact && 'text-xs')}>
          {template.ruleCount} {template.ruleCount === 1 ? 'rule' : 'rules'}
        </Badge>
      </div>

      {/* Variables count */}
      {template.variables.length > 0 && (
        <div className={cn('text-xs text-muted-foreground mb-3')}>
          Requires {template.variables.length}{' '}
          {template.variables.length === 1 ? 'variable' : 'variables'}
        </div>
      )}

      {/* Action button */}
      {onAction && (
        <Button
          size={isCompact ? 'sm' : 'default'}
          className="w-full"
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
        <div className="text-xs text-muted-foreground mt-2">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </div>
      )}
    </Card>
  );
}
