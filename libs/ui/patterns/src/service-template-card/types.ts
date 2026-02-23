/**
 * ServiceTemplateCard Types
 *
 * TypeScript interfaces for the ServiceTemplateCard pattern component.
 * Displays service templates with scope, metadata, and actions.
 */

import type { ReactNode } from 'react';

/**
 * Template scope determines access level
 */
export type TemplateScope = 'built-in' | 'custom' | 'shared';

/**
 * Template category types (aligned with service categories)
 */
export type TemplateCategory =
  | 'privacy'
  | 'proxy'
  | 'dns'
  | 'security'
  | 'monitoring'
  | 'general';

/**
 * Template metadata interface
 */
export interface TemplateMetadata {
  /** Number of services in the template */
  serviceCount: number;
  /** Number of configurable variables */
  variableCount?: number;
  /** Template author (for shared templates) */
  author?: string;
  /** Download count (for shared templates) */
  downloads?: number;
  /** Average rating (1-5, for shared templates) */
  rating?: number;
  /** Last updated date */
  updatedAt?: Date | string;
  /** Template version */
  version?: string;
  /** Template size estimate (MB) */
  sizeEstimate?: number;
}

/**
 * Action button configuration for template cards
 */
export interface TemplateAction {
  /** Action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Variant for styling */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  /** Whether action is disabled */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Service template interface
 */
export interface ServiceTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Category */
  category: TemplateCategory;
  /** Template scope */
  scope: TemplateScope;
  /** Template icon or emoji */
  icon?: ReactNode | string;
  /** Template metadata */
  metadata: TemplateMetadata;
  /** Tags for filtering */
  tags?: string[];
  /** Whether template is verified/official */
  verified?: boolean;
}

/**
 * ServiceTemplateCard component props
 */
export interface ServiceTemplateCardProps {
  /** The template to display */
  template: ServiceTemplate;
  /** Available actions (Install, Export, Delete, etc.) */
  actions?: TemplateAction[];
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom content to render in the card body */
  children?: ReactNode;
  /** Whether to show detailed metadata */
  showMetadata?: boolean;
}

/**
 * Scope color mapping for badges
 * Uses semantic color tokens from design system
 */
export const SCOPE_COLORS: Record<
  TemplateScope,
  { bg: string; text: string; label: string }
> = {
  'built-in': {
    bg: 'bg-secondary/10 dark:bg-secondary/20',
    text: 'text-secondary dark:text-secondary',
    label: 'Built-in',
  },
  custom: {
    bg: 'bg-warning/10 dark:bg-warning/20',
    text: 'text-warning dark:text-warning',
    label: 'Custom',
  },
  shared: {
    bg: 'bg-success/10 dark:bg-success/20',
    text: 'text-success dark:text-success',
    label: 'Shared',
  },
};
