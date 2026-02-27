/**
 * Network Action Buttons Component
 * Quick-action toolbar for common network operations (refresh, diagnostics, settings)
 */

import React from 'react';

import { RefreshCw, Stethoscope, Settings, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@nasnet/ui/utils';

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

export const NetworkActionButtons = React.memo(function NetworkActionButtons({
  actions = DEFAULT_ACTIONS,
  compact = false,
  className,
}: NetworkActionButtonsProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-component-sm' : 'gap-component-md',
        className
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
            'rounded-card-sm inline-flex items-center justify-center gap-1.5 border px-3 py-1.5 text-sm font-medium',
            'focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'min-h-[44px] min-w-[44px]',
            action.variant === 'destructive' ?
              'border-error bg-error/10 text-error hover:bg-error/15'
            : action.variant === 'outline' ?
              'border-border text-foreground hover:bg-muted bg-transparent'
            : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <span
            className={cn('h-4 w-4 flex-shrink-0', action.isLoading && 'animate-spin')}
            aria-hidden="true"
          >
            {action.icon}
          </span>
          {!compact && <span>{action.label}</span>}
        </button>
      ))}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Pre-built action factories (convenience helpers for consumers)
// ---------------------------------------------------------------------------

// Helper function to create localized network actions
function useNetworkActions() {
  const { t } = useTranslation('network');

  return {
    makeRefreshAction: (onClick: () => void, isLoading = false): NetworkAction => ({
      id: 'refresh',
      label: t('actions.refresh'),
      icon: <RefreshCw className="h-4 w-4" />,
      onClick,
      isLoading,
    }),

    makeDiagnosticsAction: (onClick: () => void): NetworkAction => ({
      id: 'diagnostics',
      label: t('actions.diagnostics'),
      icon: <Stethoscope className="h-4 w-4" />,
      onClick,
      variant: 'outline',
    }),

    makeSettingsAction: (onClick: () => void): NetworkAction => ({
      id: 'settings',
      label: t('actions.settings'),
      icon: <Settings className="h-4 w-4" />,
      onClick,
      variant: 'outline',
    }),

    makeExportAction: (onClick: () => void, disabled = false): NetworkAction => ({
      id: 'export',
      label: t('actions.export'),
      icon: <Download className="h-4 w-4" />,
      onClick,
      disabled,
      variant: 'outline',
    }),
  };
}

// Legacy exports - functions that return actions with translations
export function makeRefreshAction(onClick: () => void, isLoading = false): NetworkAction {
  // This requires calling useNetworkActions() in the consumer component
  // For now, provide a stub - consumers should use the hook-based approach
  return {
    id: 'refresh',
    label: 'Refresh',
    icon: <RefreshCw className="h-4 w-4" />,
    onClick,
    isLoading,
  };
}

export function makeDiagnosticsAction(onClick: () => void): NetworkAction {
  return {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: <Stethoscope className="h-4 w-4" />,
    onClick,
    variant: 'outline',
  };
}

export function makeSettingsAction(onClick: () => void): NetworkAction {
  return {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    onClick,
    variant: 'outline',
  };
}

export function makeExportAction(onClick: () => void, disabled = false): NetworkAction {
  return {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    onClick,
    disabled,
    variant: 'outline',
  };
}

export { useNetworkActions };
