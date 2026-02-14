/**
 * IsolationStatus Desktop Presenter
 *
 * Desktop-optimized UI for isolation status display.
 * Implements dense data table with inline editing.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { useState } from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@nasnet/ui/primitives';
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
export function IsolationStatusDesktop({
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
    await state.handleSaveLimits(limits);
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex items-center justify-center rounded-lg p-3',
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
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                Isolation Status
              </h3>
              <Badge
                variant={
                  state.color === 'success'
                    ? 'success'
                    : state.color === 'destructive'
                    ? 'error'
                    : 'warning'
                }
              >
                {state.healthLabel}
              </Badge>
              {state.criticalCount > 0 && (
                <Badge variant="error">{state.criticalCount} Critical</Badge>
              )}
              {state.warningCount > 0 && (
                <Badge variant="secondary">{state.warningCount} Warning{state.warningCount !== 1 ? 's' : ''}</Badge>
              )}
            </div>
            {state.timestamp && (
              <p className="text-sm text-muted-foreground mt-1">{state.timestamp}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={state.handleRefresh}
          aria-label="Refresh isolation status"
        >
          <Icons.RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Violations Table */}
      {state.violations.length > 0 && (
        <>
          <Separator className="my-5" />
          <div>
            <h4 className="text-sm font-semibold mb-3">Violations</h4>
            <div className="border rounded-lg overflow-hidden">
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
                              violation.color === 'destructive'
                                ? 'error'
                                : violation.color === 'warning'
                                ? 'warning'
                                : 'info'
                            }
                            className="inline-flex items-center gap-1"
                          >
                            {violation.violation.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ViolationIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {violation.layerLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {violation.violation.message}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {violation.violation.details || '-'}
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Resource Limits</h4>
              {!editMode && state.allowEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Icons.Edit className="w-4 h-4 mr-2" />
                  Edit Limits
                </Button>
              )}
            </div>

            {!editMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.MemoryStick className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Memory Limit
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {state.resourceLimits.memoryMB} MB
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {state.resourceLimits.applied ? 'Applied' : 'Not applied'}
                  </div>
                </div>
                {state.resourceLimits.cpuPercent !== null && state.resourceLimits.cpuPercent !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.Cpu className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        CPU Weight
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {state.resourceLimits.cpuPercent}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Scheduling priority
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memory" className="text-sm">
                      Memory Limit (MB)
                    </Label>
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
                    <Label htmlFor="cpuWeight" className="text-sm">
                      CPU Weight (0-100)
                    </Label>
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
                </div>

                <div className="flex gap-2 justify-end">
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
                    {state.isSaving ? (
                      <>
                        <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Icons.Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
