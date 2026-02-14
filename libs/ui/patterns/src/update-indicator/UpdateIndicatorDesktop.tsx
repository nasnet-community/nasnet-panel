/**
 * UpdateIndicatorDesktop Component
 * Desktop presenter for update indicator (NAS-8.7)
 * Platform: Desktop (>1024px)
 */

import * as React from 'react';
import { ShieldAlert, AlertCircle, ArrowUp, CheckCircle, Info, ExternalLink, RotateCcw } from 'lucide-react';
import {
  cn,
  Button,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@nasnet/ui/primitives';
import { UpdateProgressBar } from './UpdateProgressBar';
import { useUpdateIndicator } from './useUpdateIndicator';
import type { UpdateIndicatorProps } from './types';

/**
 * Severity icon mapping
 */
const SEVERITY_ICONS = {
  SECURITY: ShieldAlert,
  MAJOR: AlertCircle,
  MINOR: ArrowUp,
  PATCH: CheckCircle,
};

/**
 * UpdateIndicatorDesktop
 *
 * Desktop presenter for UpdateIndicator pattern.
 * Features:
 * - Inline badge display
 * - Side panel popover for details
 * - Keyboard shortcuts (Ctrl+U to update)
 * - Tooltips for additional context
 *
 * @example
 * ```tsx
 * <UpdateIndicatorDesktop
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion="1.1.0"
 *   updateAvailable={true}
 *   severity="SECURITY"
 *   onUpdate={(id) => triggerUpdate(id)}
 * />
 * ```
 */
export const UpdateIndicatorDesktop = React.memo<UpdateIndicatorProps>((props) => {
  const state = useUpdateIndicator(props);
  const [isOpen, setIsOpen] = React.useState(false);

  // Don't render if no update available and not updating
  if (!state.hasUpdate && !props.isUpdating) {
    return null;
  }

  const SeverityIcon = state.severityConfig
    ? SEVERITY_ICONS[props.severity!]
    : Info;

  // Keyboard shortcut (Ctrl+U to update)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'u' && isOpen && !state.updateDisabled) {
        e.preventDefault();
        state.handleUpdate();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, state.updateDisabled, state.handleUpdate]);

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  state.severityConfig?.bgColor,
                  props.isUpdating && 'animate-pulse'
                )}
                aria-label={state.ariaLabel}
              >
                <SeverityIcon className="h-4 w-4" aria-hidden="true" />
                <span>
                  {props.isUpdating
                    ? state.stageConfig?.label
                    : state.severityConfig?.label}
                </span>
                {!props.isUpdating && (
                  <Badge variant="outline" className="ml-1">
                    {state.latestVersionText}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{state.ariaLabel}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent side="right" align="start" className="w-96">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{props.instanceName} Update</h3>
              <p className="text-sm text-muted-foreground">
                Service instance update available
              </p>
            </div>

            {/* Version info */}
            <div className="flex items-center justify-between rounded-md bg-muted p-3">
              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="font-mono text-sm">{state.versionChangeText}</p>
              </div>
              {state.severityConfig && (
                <Badge className={cn(state.severityConfig.bgColor, state.severityConfig.textColor)}>
                  {state.severityConfig.label}
                </Badge>
              )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              {state.releaseDateText && (
                <div>
                  <p className="text-xs text-muted-foreground">Released</p>
                  <p className="text-sm">{state.releaseDateText}</p>
                </div>
              )}
              {state.binarySizeText && (
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="text-sm">{state.binarySizeText}</p>
                </div>
              )}
            </div>

            {/* Warnings */}
            {(props.requiresRestart || props.breakingChanges || props.securityFixes) && (
              <div className="space-y-1.5 rounded-md border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Important Notes</p>
                <ul className="space-y-1 text-xs">
                  {props.securityFixes && (
                    <li className="flex items-center gap-2 text-error">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Includes security fixes</span>
                    </li>
                  )}
                  {props.breakingChanges && (
                    <li className="flex items-center gap-2 text-warning">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Contains breaking changes</span>
                    </li>
                  )}
                  {props.requiresRestart && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Info className="h-3.5 w-3.5" />
                      <span>Requires service restart</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Error message */}
            {(props.updateFailed || props.wasRolledBack) && props.updateError && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error">
                {props.updateError}
              </div>
            )}

            {/* Progress */}
            {state.showProgress && (
              <UpdateProgressBar
                stage={props.updateStage!}
                progress={state.progressPercent}
                message={state.progressMessage}
              />
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {props.changelogUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={state.handleViewChangelog}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Changelog</TooltipContent>
                </Tooltip>
              )}

              {state.showRollback && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={state.handleRollback}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rollback
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Revert to {state.currentVersionText}</TooltipContent>
                </Tooltip>
              )}

              {!props.isUpdating && state.hasUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={state.handleUpdate}
                      disabled={state.updateDisabled}
                      className="ml-auto"
                    >
                      {props.securityFixes ? 'Install Security Update' : 'Install Update'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Press Ctrl+U to update</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
});

UpdateIndicatorDesktop.displayName = 'UpdateIndicatorDesktop';
