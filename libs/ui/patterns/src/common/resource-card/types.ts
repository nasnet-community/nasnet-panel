/**
 * ResourceCard Types
 *
 * TypeScript interfaces for the ResourceCard pattern component.
 */

import type { ReactNode } from 'react';

/**
 * Resource status values
 */
export type ResourceStatus =
  | 'online'
  | 'offline'
  | 'connected'
  | 'disconnected'
  | 'pending'
  | 'error'
  | 'warning'
  | 'unknown';

/**
 * Action button configuration
 */
export interface ResourceAction {
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
 * Base resource interface
 * Generic resources must extend this
 */
export interface BaseResource {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Runtime state (status, metrics, etc.) */
  runtime?: {
    status?: ResourceStatus;
    lastSeen?: Date | string;
    [key: string]: unknown;
  };
}

/**
 * ResourceCard component props
 */
export interface ResourceCardProps<T extends BaseResource> {
  /** The resource to display */
  resource: T;
  /** Available actions */
  actions?: ResourceAction[];
  /** Whether the card is expanded (for expandable variants) */
  expanded?: boolean;
  /** Toggle expanded state */
  onToggle?: () => void;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Whether to show the live pulse animation for online status */
  showLivePulse?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom content to render in the card body */
  children?: ReactNode;
}
