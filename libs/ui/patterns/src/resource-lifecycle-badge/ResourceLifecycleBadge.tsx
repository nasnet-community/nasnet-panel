/**
 * Resource Lifecycle Badge
 *
 * Displays the lifecycle state of a resource with appropriate colors and icons.
 * Part of Universal State v2 Resource Model.
 *
 * @see NAS-4.7: Universal State v2 Resource Model
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import type { ResourceLifecycleState } from '@nasnet/core/types';
import { getStateDisplayInfo } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Badge Variants
// ============================================================================

const lifecycleBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      state: {
        DRAFT: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/20',
        VALIDATING: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        VALID: 'bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-green-400',
        APPLYING: 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        ACTIVE: 'bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-green-400',
        DEGRADED: 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        ERROR: 'bg-error/10 text-error ring-error/20 dark:bg-error/20 dark:text-red-400',
        DEPRECATED: 'bg-slate-100 text-slate-500 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-600/20',
        ARCHIVED: 'bg-slate-100 text-slate-400 ring-slate-300/20 dark:bg-slate-900 dark:text-slate-600 dark:ring-slate-700/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      state: 'DRAFT',
      size: 'md',
    },
  }
);

// ============================================================================
// Spinner Component
// ============================================================================

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================================================
// Icon Components
// ============================================================================

const DraftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
      clipRule="evenodd"
    />
  </svg>
);

const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('h-3 w-3', className)}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2z" />
    <path
      fillRule="evenodd"
      d="M2 7.5h16l-.811 7.71a2 2 0 01-1.99 1.79H4.802a2 2 0 01-1.99-1.79L2 7.5zm5.22 1.72a.75.75 0 011.06 0L10 10.94l1.72-1.72a.75.75 0 111.06 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

// ============================================================================
// State Icon Component
// ============================================================================

function getStateIcon(state: ResourceLifecycleState): React.ReactNode {
  const displayInfo = getStateDisplayInfo(state);

  if (displayInfo.showSpinner) {
    return <Spinner />;
  }

  switch (displayInfo.icon) {
    case 'draft':
      return <DraftIcon />;
    case 'check':
      return <CheckIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'archive':
      return <ArchiveIcon />;
    default:
      return null;
  }
}

// ============================================================================
// Component
// ============================================================================

export interface ResourceLifecycleBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof lifecycleBadgeVariants> {
  /** Resource lifecycle state */
  state: ResourceLifecycleState;
  /** Override the default label */
  label?: string;
  /** Show icon before label */
  showIcon?: boolean;
  /** Show tooltip with description */
  showTooltip?: boolean;
}

export const ResourceLifecycleBadge = React.forwardRef<
  HTMLSpanElement,
  ResourceLifecycleBadgeProps
>(({ className, state, size, label, showIcon = true, showTooltip = false, ...props }, ref) => {
  const displayInfo = getStateDisplayInfo(state);
  const displayLabel = label ?? displayInfo.label;

  return (
    <span
      ref={ref}
      className={cn(lifecycleBadgeVariants({ state, size }), className)}
      title={showTooltip ? displayInfo.description : undefined}
      {...props}
    >
      {showIcon && getStateIcon(state)}
      {displayLabel}
    </span>
  );
});

ResourceLifecycleBadge.displayName = 'ResourceLifecycleBadge';

export { lifecycleBadgeVariants };
export default ResourceLifecycleBadge;
