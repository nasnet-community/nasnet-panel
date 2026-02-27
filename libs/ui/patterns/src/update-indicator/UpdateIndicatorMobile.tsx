/**
 * UpdateIndicatorMobile Component
 * Mobile presenter for update indicator (NAS-8.7)
 * Platform: Mobile (<640px)
 */

import * as React from 'react';

import { ShieldAlert, AlertCircle, ArrowUp, CheckCircle, Info, ExternalLink } from 'lucide-react';

import {
  cn,
  Button,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
 * UpdateIndicatorMobile
 *
 * Mobile presenter for UpdateIndicator pattern.
 * Features:
 * - 44px touch targets
 * - Bottom sheet for details
 * - Amber/red badges for severity
 * - Stack layout for readability
 *
 * @example
 * ```tsx
 * <UpdateIndicatorMobile
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
export const UpdateIndicatorMobile = React.memo<UpdateIndicatorProps>((props) => {
  const state = useUpdateIndicator(props);
  const [isOpen, setIsOpen] = React.useState(false);

  // Don't render if no update available and not updating
  if (!state.hasUpdate && !props.isUpdating) {
    return null;
  }

  const SeverityIcon = state.severityConfig ? SEVERITY_ICONS[props.severity!] : Info;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SheetTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors',
            'hover:bg-muted cursor-pointer rounded-lg',
            'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'min-h-[44px]', // WCAG AAA touch target
            props.isUpdating && 'animate-pulse'
          )}
          aria-label={state.ariaLabel}
        >
          {/* Mobile: Icon-only with dot indicator */}
          {!state.showProgress && (
            <>
              <div className="bg-info h-2 w-2 flex-shrink-0 animate-pulse rounded-full" />
              <span className="text-foreground flex-1">
                {props.isUpdating ? state.stageConfig?.label : state.severityConfig?.label}
              </span>
            </>
          )}

          {/* Progress bar for updates in progress */}
          {state.showProgress && (
            <div className="w-full">
              <UpdateProgressBar
                stage={props.updateStage!}
                progress={state.progressPercent}
                message={state.progressMessage}
              />
            </div>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[80vh]"
      >
        <SheetHeader>
          <SheetTitle>{props.instanceName} Update</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Version info */}
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">Version</h3>
            <p className="font-mono text-lg">{state.versionChangeText}</p>
          </div>

          {/* Severity badge */}
          {state.severityConfig && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">Severity</h3>
              <Badge className={cn(state.severityConfig.bgColor, state.severityConfig.textColor)}>
                {state.severityConfig.label}
              </Badge>
            </div>
          )}

          {/* Release info */}
          {state.releaseDateText && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">Released</h3>
              <p className="text-sm">{state.releaseDateText}</p>
            </div>
          )}

          {/* Binary size */}
          {state.binarySizeText && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">Download Size</h3>
              <p className="text-sm">{state.binarySizeText}</p>
            </div>
          )}

          {/* Warnings */}
          {(props.requiresRestart || props.breakingChanges || props.securityFixes) && (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">Notes</h3>
              <ul className="space-y-1 text-sm">
                {props.securityFixes && (
                  <li className="text-error flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Includes security fixes</span>
                  </li>
                )}
                {props.breakingChanges && (
                  <li className="text-warning flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Contains breaking changes</span>
                  </li>
                )}
                {props.requiresRestart && (
                  <li className="text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Requires service restart</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Error message */}
          {(props.updateFailed || props.wasRolledBack) && props.updateError && (
            <div className="bg-error/10 rounded-md p-4">
              <p className="text-error text-sm">{props.updateError}</p>
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
          <div className="flex flex-col gap-3 pt-4">
            {props.changelogUrl && (
              <Button
                variant="outline"
                onClick={state.handleViewChangelog}
                className="min-h-[44px] w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Changelog
              </Button>
            )}

            {state.showRollback && (
              <Button
                variant="outline"
                onClick={state.handleRollback}
                className="min-h-[44px] w-full"
              >
                Rollback to {state.currentVersionText}
              </Button>
            )}

            {!props.isUpdating && state.hasUpdate && (
              <Button
                onClick={state.handleUpdate}
                disabled={state.updateDisabled}
                className="min-h-[44px] w-full"
              >
                {props.securityFixes ? 'Install Security Update' : 'Install Update'}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

UpdateIndicatorMobile.displayName = 'UpdateIndicatorMobile';
