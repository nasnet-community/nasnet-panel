/**
 * IsolationStatus Mobile Presenter
 *
 * Mobile-optimized UI for isolation status display.
 * Implements touch-first interaction with 44px targets (WCAG AAA).
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { useState } from 'react';

import * as Icons from 'lucide-react';

import { cn ,
  Card,
  Badge,
  Button,
  Alert,
  AlertDescription,
  Separator,
  Input,
  Label,
  ScrollArea,
} from '@nasnet/ui/primitives';


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
export function IsolationStatusMobile({
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
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              'min-w-[44px] min-h-[44px]',
              state.color === 'success' && 'bg-semantic-success/10',
              state.color === 'warning' && 'bg-semantic-warning/10',
              state.color === 'destructive' && 'bg-semantic-error/10',
              state.color === 'muted' && 'bg-semantic-muted/10'
            )}
          >
            <Icon
              className={cn(
                'w-6 h-6',
                state.color === 'success' && 'text-semantic-success',
                state.color === 'warning' && 'text-semantic-warning',
                state.color === 'destructive' && 'text-semantic-error',
                state.color === 'muted' && 'text-semantic-muted'
              )}
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{state.healthLabel}</h3>
            {state.timestamp && (
              <p className="text-xs text-muted-foreground mt-1">{state.timestamp}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={state.handleRefresh}
          className="min-w-[44px] min-h-[44px]"
          aria-label="Refresh isolation status"
        >
          <Icons.RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Badges */}
      {state.violationCount > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {state.criticalCount > 0 && (
            <Badge variant="error">
              {state.criticalCount} Critical
            </Badge>
          )}
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
              className="w-full min-h-[44px] justify-between px-0 hover:bg-transparent"
              aria-expanded={showViolations}
            >
              <span className="font-medium">
                Violations ({state.violations.length})
              </span>
              <Icons.ChevronDown
                className={cn(
                  'w-5 h-5 transition-transform',
                  showViolations && 'rotate-180'
                )}
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
                        violation.color === 'warning' && 'border-semantic-warning bg-semantic-warning/5',
                        violation.color === 'muted' && 'border-semantic-muted bg-semantic-muted/5'
                      )}
                    >
                      <ViolationIcon className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">{violation.layerLabel}</div>
                        <div className="text-sm">{violation.violation.message}</div>
                        {violation.violation.layer && (
                          <div className="text-xs text-muted-foreground mt-2 font-mono">
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
              className="w-full min-h-[44px] justify-between px-0 hover:bg-transparent"
              aria-expanded={showLimits}
            >
              <span className="font-medium">Resource Limits</span>
              <Icons.ChevronDown
                className={cn(
                  'w-5 h-5 transition-transform',
                  showLimits && 'rotate-180'
                )}
              />
            </Button>

            {showLimits && (
              <div className="mt-3 space-y-4">
                {!editMode ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {state.resourceLimits.cpuPercent !== null && state.resourceLimits.cpuPercent !== undefined && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-1">CPU</div>
                          <div className="text-base font-semibold">
                            {state.resourceLimits.cpuPercent}%
                          </div>
                        </div>
                      )}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Memory</div>
                        <div className="text-base font-semibold">
                          {state.resourceLimits.memoryMB} MB
                        </div>
                      </div>
                    </div>

                    {state.allowEdit && (
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                        className="w-full min-h-[44px]"
                      >
                        <Icons.Edit className="w-4 h-4 mr-2" />
                        Edit Limits
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="memory">Memory (MB)</Label>
                      <Input
                        id="memory"
                        type="number"
                        min="16"
                        value={limits.memoryMB}
                        onChange={(e) =>
                          setLimits({ ...limits, memoryMB: Number(e.target.value) })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum: 16 MB</p>
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
                      <p className="text-xs text-muted-foreground mt-1">CPU scheduling priority</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={handleSave}
                        disabled={state.isSaving}
                        className="flex-1 min-h-[44px]"
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
                        className="flex-1 min-h-[44px]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
