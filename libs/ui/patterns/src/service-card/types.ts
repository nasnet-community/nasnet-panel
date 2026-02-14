/**
 * ServiceCard Types
 *
 * TypeScript interfaces for the ServiceCard pattern component.
 * Displays downloadable network services from the Feature Marketplace.
 */

import type { ReactNode } from 'react';

/**
 * Service status values (from ServiceInstance ent schema)
 */
export type ServiceStatus =
  | 'installing'
  | 'installed'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'deleting'
  | 'available'; // Not yet installed

/**
 * Service category types
 */
export type ServiceCategory =
  | 'privacy'
  | 'proxy'
  | 'dns'
  | 'security'
  | 'monitoring';

/**
 * Action button configuration
 */
export interface ServiceAction {
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
 * Service instance interface
 * Represents a downloadable network service
 */
export interface Service {
  /** Unique identifier (feature ID for available, instance ID for installed) */
  id: string;
  /** Service name */
  name: string;
  /** Description */
  description?: string;
  /** Category */
  category: ServiceCategory;
  /** Current status */
  status: ServiceStatus;
  /** Service version */
  version?: string;
  /** Icon URL or component */
  icon?: ReactNode;
  /** Resource metrics (CPU, RAM, Network) */
  metrics?: {
    cpu?: number; // Percentage
    memory?: number; // MB
    currentMemory?: number; // Current memory usage in MB
    memoryLimit?: number; // Memory limit in MB
    network?: {
      rx: number; // bytes/s
      tx: number; // bytes/s
    };
  };
  /** Installation/runtime info */
  runtime?: {
    installedAt?: Date | string;
    lastStarted?: Date | string;
    uptime?: number; // seconds
  };
}

/**
 * ServiceCard component props
 */
export interface ServiceCardProps {
  /** The service to display */
  service: Service;
  /** Available actions (Install, Start, Stop, Configure, Delete) */
  actions?: ServiceAction[];
  /** Whether to show resource metrics */
  showMetrics?: boolean;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Custom content to render in the card body */
  children?: ReactNode;
}
