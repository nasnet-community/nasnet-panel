/**
 * IsolationStatus Mobile Presenter
 *
 * Mobile-optimized UI for isolation status display.
 * Implements touch-first interaction with 44px targets (WCAG AAA).
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { useState, memo } from 'react';

import * as Icons from 'lucide-react';

import {
  Badge,
  Button,
  Alert,
  AlertDescription,
  Separator,
  Input,
  Label,
  ScrollArea,
  Card,
} from '@nasnet/ui/primitives';

import { cn } from '@nasnet/ui/utils';

import type { IsolationStatusPresenterProps } from './types';

/**
 * Mobile presenter for IsolationStatus component.
 *
 * Features:
 * - Collapsible sections for violations and resource limits
 * - 44px minimum touch targets (WCAG AAA)
 * - Category accent colors for violation severity
 * - Vertical stack layout optimized for narrow screens
 *
 * @param props - Presenter props with computed state
 */
const IsolationStatusMobileComponent = memo(function IsolationStatusMobile({
  state,
  size = 'md',
  className,
  id,
}: IsolationStatusPresenterProps) {
  const [showViolations, setShowViolations] = useState(state.violationCount > 0);
  const [showLimits, setShowLimits] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [limits, setLimits] = useState({
    memoryMB: state.resourceLimits?.memoryMB ?? 256,
    cpuWeight: state.resourceLimits?.cpuPercent ?? 50,
  });

  const Icon = Icons[state.iconName];

  const handleSave = async () => {
    await state.handleSaveLimits(limits as any);
    setEditMode(false);
  };

  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-5',
  };

  return (
    <Card
      className={cn('w-full', sizeClasses[size], className)}
      id={id}
      role="region"
      aria-label={state.ariaLabel}
    >
      {/* Header Section */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              'min-h-[44px] min-w-[44px]',
              state.color === 'success' && 'bg-success-light',
              state.color === 'warning' && 'bg-warning-light',
              state.color === 'destructive' && 'bg-error-light',
              state.color === 'muted' && 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                state.color === 'success' && 'text-success-dark',
                state.color === 'warning' && 'text-warning-dark',
                state.color === 'destructive' && 'text-error-dark',
                state.color === 'muted' && 'text-muted-foreground'
              )}
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{state.healthLabel}</h3>
            {state.timestamp && (
              <p className="text-muted-foreground mt-1 text-xs">{state.timestamp}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={state.handleRefresh}
          className="min-h-[44px] min-w-[44px]"
          aria-label="Refresh isolation status"
        >
          <Icons.RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Badges */}
      {state.violationCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {state.criticalCount > 0 && <Badge variant="error">{state.criticalCount} Critical</Badge>}
          {state.warningCount > 0 && (
            <Badge variant="secondary">
              {state.warningCount} Warning{state.warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Violations Section */}
      {state.violations.length > 0 && (
        <>
          <Separator className="my-4" />
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowViolations(!showViolations)}
              className="min-h-[44px] w-full justify-between px-0 hover:bg-transparent"
              aria-expanded={showViolations}
            >
              <span className="font-medium">Violations ({state.violations.length})</span>
              <Icons.ChevronDown
                className={cn('h-5 w-5 transition-transform', showViolations && 'rotate-180')}
              />
            </Button>

            {showViolations && (
              <div className="mt-3 space-y-3">
                {state.violations.map((violation, index) => {
                  const ViolationIcon: React.ComponentType<{ className?: string }> =
                    (Icons as any)[violation.icon] || Icons.AlertCircle;

                  return (
                    <Alert
                      key={index}
                      variant={violation.color === 'destructive' ? 'destructive' : 'default'}
                      className={cn(
                        'text-left',
                        violation.color === 'warning' && 'border-warning bg-warning-light',
                        violation.color === 'muted' && 'border-border bg-muted'
                      )}
                    >
                      <ViolationIcon className="h-4 w-4" />
                      <AlertDescription>
                        <div className="mb-1 font-medium">{violation.layerLabel}</div>
                        <div className="text-sm">{violation.violation.message}</div>
                        {violation.violation.layer && (
                          <div className="text-muted-foreground mt-2 font-mono text-xs">
                            {violation.violation.layer}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Resource Limits Section */}
      {state.showResourceLimits && state.resourceLimits && (
        <>
          <Separator className="my-4" />
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowLimits(!showLimits)}
              className="min-h-[44px] w-full justify-between px-0 hover:bg-transparent"
              aria-expanded={showLimits}
            >
              <span className="font-medium">Resource Limits</span>
              <Icons.ChevronDown
                className={cn('h-5 w-5 transition-transform', showLimits && 'rotate-180')}
              />
            </Button>

            {showLimits && (
              <div className="mt-3 space-y-4">
                {!editMode ?
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {state.resourceLimits.cpuPercent !== null &&
                        state.resourceLimits.cpuPercent !== undefined && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="text-muted-foreground mb-1 text-xs">CPU</div>
                            <div className="text-base font-semibold">
                              {state.resourceLimits.cpuPercent}%
                            </div>
                          </div>
                        )}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-muted-foreground mb-1 text-xs">Memory</div>
                        <div className="text-base font-semibold">
                          {state.resourceLimits.memoryMB} MB
                        </div>
                      </div>
                    </div>

                    {state.allowEdit && (
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                        className="min-h-[44px] w-full"
                      >
                        <Icons.Edit className="mr-2 h-4 w-4" />
                        Edit Limits
                      </Button>
                    )}
                  </>
                : <div className="space-y-4">
                    <div>
                      <Label htmlFor="memory">Memory (MB)</Label>
                      <Input
                        id="memory"
                        type="number"
                        min="16"
                        value={limits.memoryMB}
                        onChange={(e) => setLimits({ ...limits, memoryMB: Number(e.target.value) })}
                        className="mt-1"
                      />
                      <p className="text-muted-foreground mt-1 text-xs">Minimum: 16 MB</p>
                    </div>
                    <div>
                      <Label htmlFor="cpuWeight">CPU Weight (0-100)</Label>
                      <Input
                        id="cpuWeight"
                        type="number"
                        min="0"
                        max="100"
                        value={limits.cpuWeight ?? 50}
                        onChange={(e) =>
                          setLimits({ ...limits, cpuWeight: Number(e.target.value) })
                        }
                        className="mt-1"
                      />
                      <p className="text-muted-foreground mt-1 text-xs">CPU scheduling priority</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={handleSave}
                        disabled={state.isSaving}
                        className="min-h-[44px] flex-1"
                      >
                        {state.isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setLimits({
                            memoryMB: state.resourceLimits?.memoryMB ?? 256,
                            cpuWeight: state.resourceLimits?.cpuPercent ?? 50,
                          });
                        }}
                        disabled={state.isSaving}
                        className="min-h-[44px] flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                }
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
});

IsolationStatusMobileComponent.displayName = 'IsolationStatusMobile';

export { IsolationStatusMobileComponent as IsolationStatusMobile };
