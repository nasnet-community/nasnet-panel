/**
 * IsolationStatus Desktop Presenter
 *
 * Desktop-optimized UI for isolation status display.
 * Implements dense data table with inline editing.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { useState, memo } from 'react';

import * as Icons from 'lucide-react';

import {
  Card,
  Badge,
  Button,
  Alert,
  AlertDescription,
  Separator,
  Input,
  Label,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nasnet/ui/primitives';

import { cn } from '@nasnet/ui/utils';

import type { IsolationStatusPresenterProps } from './types';

/**
 * Desktop presenter for IsolationStatus component.
 *
 * Features:
 * - Data table for violations with sortable columns
 * - Inline editing for resource limits
 * - Dense information display
 * - Horizontal layout optimized for wide screens
 *
 * @param props - Presenter props with computed state
 */
const IsolationStatusDesktopComponent = memo(function IsolationStatusDesktop({
  state,
  size = 'md',
  className,
  id,
}: IsolationStatusPresenterProps) {
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
    sm: 'text-sm p-4',
    md: 'text-base p-5',
    lg: 'text-lg p-6',
  };

  return (
    <Card
      className={cn('w-full', sizeClasses[size], className)}
      id={id}
      role="region"
      aria-label={state.ariaLabel}
    >
      {/* Header Section */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg p-3',
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
            <div className="flex items-center gap-3">
              <h3 className="text-foreground text-lg font-semibold">Isolation Status</h3>
              <Badge
                variant={
                  state.color === 'success' ? 'success'
                  : state.color === 'destructive' ?
                    'error'
                  : 'warning'
                }
              >
                {state.healthLabel}
              </Badge>
              {state.criticalCount > 0 && (
                <Badge variant="error">{state.criticalCount} Critical</Badge>
              )}
              {state.warningCount > 0 && (
                <Badge variant="secondary">
                  {state.warningCount} Warning{state.warningCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {state.timestamp && (
              <p className="text-muted-foreground mt-1 text-sm">{state.timestamp}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={state.handleRefresh}
          aria-label="Refresh isolation status"
        >
          <Icons.RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Violations Table */}
      {state.violations.length > 0 && (
        <>
          <Separator className="my-5" />
          <div>
            <h4 className="mb-3 text-sm font-semibold">Violations</h4>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Severity</TableHead>
                    <TableHead className="w-[140px]">Layer</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[200px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.violations.map((violation, index) => {
                    const ViolationIcon: React.ComponentType<{ className?: string }> =
                      (Icons as any)[violation.icon] || Icons.AlertCircle;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge
                            variant={
                              violation.color === 'destructive' ? 'error'
                              : violation.color === 'warning' ?
                                'warning'
                              : 'info'
                            }
                            className="inline-flex items-center gap-1"
                          >
                            {violation.violation.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ViolationIcon className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm font-medium">{violation.layerLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {violation.violation.message}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {violation.violation.layer || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Resource Limits Section */}
      {state.showResourceLimits && state.resourceLimits && (
        <>
          <Separator className="my-5" />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Resource Limits</h4>
              {!editMode && state.allowEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Icons.Edit className="mr-2 h-4 w-4" />
                  Edit Limits
                </Button>
              )}
            </div>

            {!editMode ?
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Icons.MemoryStick className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-xs font-medium">Memory Limit</span>
                  </div>
                  <div className="text-2xl font-bold">{state.resourceLimits.memoryMB} MB</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {state.resourceLimits.applied ? 'Applied' : 'Not applied'}
                  </div>
                </div>
                {state.resourceLimits.cpuPercent !== null &&
                  state.resourceLimits.cpuPercent !== undefined && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Icons.Cpu className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground text-xs font-medium">
                          CPU Weight
                        </span>
                      </div>
                      <div className="text-2xl font-bold">{state.resourceLimits.cpuPercent}%</div>
                      <div className="text-muted-foreground mt-1 text-xs">Scheduling priority</div>
                    </div>
                  )}
              </div>
            : <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="memory"
                      className="text-sm"
                    >
                      Memory Limit (MB)
                    </Label>
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
                    <Label
                      htmlFor="cpuWeight"
                      className="text-sm"
                    >
                      CPU Weight (0-100)
                    </Label>
                    <Input
                      id="cpuWeight"
                      type="number"
                      min="0"
                      max="100"
                      value={limits.cpuWeight ?? 50}
                      onChange={(e) => setLimits({ ...limits, cpuWeight: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-muted-foreground mt-1 text-xs">CPU scheduling priority</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
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
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={state.isSaving}
                  >
                    {state.isSaving ?
                      <>
                        <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    : <>
                        <Icons.Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    }
                  </Button>
                </div>
              </div>
            }
          </div>
        </>
      )}
    </Card>
  );
});

IsolationStatusDesktopComponent.displayName = 'IsolationStatusDesktop';

export { IsolationStatusDesktopComponent as IsolationStatusDesktop };
