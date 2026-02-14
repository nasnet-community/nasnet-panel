/**
 * UpdateAllPanel Component (NAS-8.7)
 * Aggregate view of pending updates with bulk update functionality
 */

import * as React from 'react';
import { ShieldAlert, AlertCircle, ArrowUp, CheckCircle, RefreshCw } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  cn,
} from '@nasnet/ui/primitives';
import type { AvailableUpdate, UpdateSeverity } from '@nasnet/api-client/queries';

export interface UpdateAllPanelProps {
  /** Available updates for all instances */
  updates: AvailableUpdate[];

  /** Callback when "Update All" is clicked */
  onUpdateAll?: () => void;

  /** Callback when individual update is clicked */
  onUpdate?: (instanceId: string) => void;

  /** Map of instances currently updating */
  updatingInstances?: Record<string, boolean>;

  /** Map of update progress per instance */
  updateProgress?: Record<string, number>;

  /** Whether the panel is in loading state */
  loading?: boolean;

  /** Additional CSS class */
  className?: string;
}

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
 * Severity color mapping
 */
const SEVERITY_COLORS: Record<UpdateSeverity, string> = {
  SECURITY: 'bg-error/10 text-error',
  MAJOR: 'bg-warning/10 text-warning',
  MINOR: 'bg-info/10 text-info',
  PATCH: 'bg-success/10 text-success',
};

/**
 * Severity priority (for sorting)
 */
const SEVERITY_PRIORITY: Record<UpdateSeverity, number> = {
  SECURITY: 4,
  MAJOR: 3,
  MINOR: 2,
  PATCH: 1,
};

/**
 * UpdateAllPanel
 *
 * Displays aggregate view of pending updates:
 * - Grouped by severity
 * - Total update count
 * - "Update All" action with confirmation
 * - Per-instance progress tracking
 * - Sequential update execution (one at a time)
 *
 * @example
 * ```tsx
 * <UpdateAllPanel
 *   updates={availableUpdates}
 *   onUpdateAll={() => updateAllInstances()}
 *   onUpdate={(id) => updateInstance(id)}
 *   updatingInstances={updatingMap}
 *   updateProgress={progressMap}
 * />
 * ```
 */
export function UpdateAllPanel(props: UpdateAllPanelProps) {
  const {
    updates,
    onUpdateAll,
    onUpdate,
    updatingInstances = {},
    updateProgress = {},
    loading,
    className,
  } = props;

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  // Count updates by severity
  const updateCounts = React.useMemo(() => {
    const counts = {
      SECURITY: 0,
      MAJOR: 0,
      MINOR: 0,
      PATCH: 0,
    };

    updates.forEach((update) => {
      if (update.updateAvailable && update.severity) {
        counts[update.severity]++;
      }
    });

    return counts;
  }, [updates]);

  // Total updates available
  const totalUpdates = React.useMemo(
    () => updates.filter((u) => u.updateAvailable).length,
    [updates]
  );

  // Sort updates by severity (highest first)
  const sortedUpdates = React.useMemo(() => {
    return [...updates]
      .filter((u) => u.updateAvailable)
      .sort((a, b) => {
        const priorityA = SEVERITY_PRIORITY[a.severity ?? 'PATCH'];
        const priorityB = SEVERITY_PRIORITY[b.severity ?? 'PATCH'];
        return priorityB - priorityA;
      });
  }, [updates]);

  // Count currently updating instances
  const updatingCount = React.useMemo(
    () => Object.values(updatingInstances).filter(Boolean).length,
    [updatingInstances]
  );

  // Handle "Update All" click
  const handleUpdateAllClick = React.useCallback(() => {
    setConfirmDialogOpen(true);
  }, []);

  // Handle confirmation
  const handleConfirm = React.useCallback(() => {
    setConfirmDialogOpen(false);
    onUpdateAll?.();
  }, [onUpdateAll]);

  // Don't render if no updates available
  if (totalUpdates === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn('border-primary/20', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Updates Available
              </CardTitle>
              <CardDescription>
                {totalUpdates} {totalUpdates === 1 ? 'update' : 'updates'} ready
                to install
              </CardDescription>
            </div>
            <Button
              onClick={handleUpdateAllClick}
              disabled={loading || updatingCount > 0}
              size="sm"
            >
              Update All ({totalUpdates})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Severity breakdown */}
          {(updateCounts.SECURITY > 0 ||
            updateCounts.MAJOR > 0 ||
            updateCounts.MINOR > 0 ||
            updateCounts.PATCH > 0) && (
            <div className="flex flex-wrap gap-2">
              {updateCounts.SECURITY > 0 && (
                <Badge className={SEVERITY_COLORS.SECURITY}>
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {updateCounts.SECURITY} Security
                </Badge>
              )}
              {updateCounts.MAJOR > 0 && (
                <Badge className={SEVERITY_COLORS.MAJOR}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {updateCounts.MAJOR} Major
                </Badge>
              )}
              {updateCounts.MINOR > 0 && (
                <Badge className={SEVERITY_COLORS.MINOR}>
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {updateCounts.MINOR} Minor
                </Badge>
              )}
              {updateCounts.PATCH > 0 && (
                <Badge className={SEVERITY_COLORS.PATCH}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {updateCounts.PATCH} Patch
                </Badge>
              )}
            </div>
          )}

          {/* Security warning if security updates present */}
          {updateCounts.SECURITY > 0 && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Security Updates Available</AlertTitle>
              <AlertDescription>
                {updateCounts.SECURITY}{' '}
                {updateCounts.SECURITY === 1 ? 'update includes' : 'updates include'}{' '}
                security fixes. We recommend updating as soon as possible.
              </AlertDescription>
            </Alert>
          )}

          {/* Update list (first 5) */}
          <div className="space-y-2">
            {sortedUpdates.slice(0, 5).map((update) => {
              const isUpdating = updatingInstances[update.instanceId];
              const progress = updateProgress[update.instanceId] ?? 0;
              const SeverityIcon = update.severity
                ? SEVERITY_ICONS[update.severity]
                : CheckCircle;

              return (
                <div
                  key={update.instanceId}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {update.instanceName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        v{update.currentVersion} → v{update.latestVersion}
                      </span>
                    </div>
                    {isUpdating && (
                      <Progress value={progress} className="h-1.5 mt-2" />
                    )}
                  </div>
                  {!isUpdating && onUpdate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate(update.instanceId)}
                      className="ml-2"
                    >
                      Update
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show "and X more" if there are more updates */}
          {sortedUpdates.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              and {sortedUpdates.length - 5} more...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update All Services?</DialogTitle>
            <DialogDescription>
              This will update {totalUpdates}{' '}
              {totalUpdates === 1 ? 'service' : 'services'} sequentially (one at a
              time). Each service will be stopped, updated, and restarted.
            </DialogDescription>
          </DialogHeader>

          {updateCounts.SECURITY > 0 && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Security Updates Included</AlertTitle>
              <AlertDescription>
                {updateCounts.SECURITY}{' '}
                {updateCounts.SECURITY === 1 ? 'update includes' : 'updates include'}{' '}
                security fixes.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Update All ({totalUpdates})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
