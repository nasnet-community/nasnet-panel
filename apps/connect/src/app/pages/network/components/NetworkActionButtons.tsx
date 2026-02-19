/**
 * Network Action Buttons Component
 * Quick-action toolbar for common network operations (refresh, diagnostics, settings)
 */

import { RefreshCw, Stethoscope, Settings, Download } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface NetworkAction {
  /** Unique identifier used as the React key */
  id: string;
  /** Button label visible to the user */
  label: string;
  /** Lucide icon element */
  icon: React.ReactNode;
  /** Callback invoked on click */
  onClick: () => void;
  /** Whether the action is currently in a loading/busy state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'default' | 'destructive' | 'outline';
}

interface NetworkActionButtonsProps {
  /** Actions to render as buttons */
  actions?: NetworkAction[];
  /** When true the whole toolbar renders in a compact icon-only mode */
  compact?: boolean;
  /** Additional Tailwind classes for the wrapper */
  className?: string;
}

const DEFAULT_ACTIONS: NetworkAction[] = [];

export function NetworkActionButtons({
  actions = DEFAULT_ACTIONS,
  compact = false,
  className,
}: NetworkActionButtonsProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        compact ? 'gap-1' : 'gap-2',
        className,
      )}
      role="toolbar"
      aria-label="Network actions"
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled || action.isLoading}
          onClick={action.onClick}
          aria-label={action.label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'min-h-[44px]',
            action.variant === 'destructive'
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
              : action.variant === 'outline'
                ? 'border-border bg-transparent text-foreground hover:bg-accent'
                : 'border-border bg-background text-foreground hover:bg-accent',
          )}
        >
          <span
            className={cn(
              'w-4 h-4 flex-shrink-0',
              action.isLoading && 'animate-spin',
            )}
            aria-hidden="true"
          >
            {action.icon}
          </span>
          {!compact && <span>{action.label}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pre-built action factories (convenience helpers for consumers)
// ---------------------------------------------------------------------------

export function makeRefreshAction(onClick: () => void, isLoading = false): NetworkAction {
  return {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw className="w-4 h-4" />,
    onClick,
    isLoading,
  };
}

export function makeDiagnosticsAction(onClick: () => void): NetworkAction {
  return {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: <Stethoscope className="w-4 h-4" />,
    onClick,
    variant: 'outline',
  };
}

export function makeSettingsAction(onClick: () => void): NetworkAction {
  return {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    onClick,
    variant: 'outline',
  };
}

export function makeExportAction(onClick: () => void, disabled = false): NetworkAction {
  return {
    id: 'export',
    label: 'Export',
    icon: <Download className="w-4 h-4" />,
    onClick,
    disabled,
    variant: 'outline',
  };
}
