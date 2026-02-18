import * as React from 'react';

import type {
  DriftResult,
  DriftResolutionAction,
  DriftResolutionRequest,
} from '@nasnet/state/stores';
import {
  cn,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@nasnet/ui/primitives';

import { DriftDiffViewer } from './DriftDiffViewer';

/**
 * Drift Resolution Modal Component
 *
 * Modal dialog for resolving configuration drift with three actions:
 * 1. Re-apply: Overwrite router state with desired configuration
 * 2. Accept: Update configuration to match router's actual state
 * 3. View diff: Detailed side-by-side comparison before deciding
 *
 * Includes confirmation dialogs for destructive actions.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

// =============================================================================
// Types
// =============================================================================

export interface DriftResolutionModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback to close the modal
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Drift detection result
   */
  result: DriftResult;
  /**
   * Resource name for display
   */
  resourceName: string;
  /**
   * Resource UUID for API calls
   */
  resourceUuid: string;
  /**
   * Callback when resolution action is selected
   */
  onResolve: (request: DriftResolutionRequest) => Promise<void>;
  /**
   * Whether a resolution action is in progress
   */
  isResolving?: boolean;
  /**
   * Error message from last resolution attempt
   */
  error?: string;
}

type ModalState =
  | 'diff' // Showing diff view
  | 'confirm-reapply' // Confirming re-apply action
  | 'confirm-accept'; // Confirming accept action

// =============================================================================
// Sub-Components
// =============================================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'destructive' | 'outline';
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({
  icon,
  title,
  description,
  variant = 'outline',
  onClick,
  disabled,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-2 p-4 rounded-lg border transition-all',
        'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'default' && 'border-primary bg-primary/5 hover:bg-primary/10',
        variant === 'destructive' && 'border-error bg-error/5 hover:bg-error/10',
        variant === 'outline' && 'border-border'
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground text-left">{description}</p>
    </button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * DriftResolutionModal provides a UI for resolving configuration drift.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <DriftResolutionModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   result={driftResult}
 *   resourceName="USA VPN"
 *   resourceUuid="abc123"
 *   onResolve={async (request) => {
 *     await resolveDrift(request);
 *     setOpen(false);
 *   }}
 * />
 * ```
 */
export function DriftResolutionModal({
  open,
  onOpenChange,
  result,
  resourceName,
  resourceUuid,
  onResolve,
  isResolving = false,
  error,
}: DriftResolutionModalProps) {
  const [state, setState] = React.useState<ModalState>('diff');
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setState('diff');
      setSelectedFields([]);
    }
  }, [open]);

  const handleReapply = async () => {
    await onResolve({
      resourceUuid,
      action: 'REAPPLY' as DriftResolutionAction,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    });
  };

  const handleAccept = async () => {
    await onResolve({
      resourceUuid,
      action: 'ACCEPT' as DriftResolutionAction,
      fields: selectedFields.length > 0 ? selectedFields : undefined,
    });
  };

  const handleDismiss = () => {
    onOpenChange(false);
  };

  const handleFieldSelect = (field: { path: string }) => {
    setSelectedFields((prev) =>
      prev.includes(field.path)
        ? prev.filter((p) => p !== field.path)
        : [...prev, field.path]
    );
  };

  const driftCount = result.driftedFields.length;
  const selectedCount = selectedFields.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-warning"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v4m0 4h.01M3.516 15.1l6.03-11.003c.874-1.593 3.034-1.593 3.908 0l6.03 11.004c.87 1.586-.23 3.559-1.954 3.559H5.47c-1.724 0-2.824-1.973-1.954-3.56z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Resolve Configuration Drift
          </DialogTitle>
          <DialogDescription>
            {resourceName} has {driftCount} field{driftCount === 1 ? '' : 's'}{' '}
            that differ between your configuration and the router.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mx-6">
            <AlertTitle>Resolution Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content based on state */}
        <div className="flex-1 overflow-hidden px-6">
          {state === 'diff' && (
            <div className="space-y-4">
              {/* Diff Viewer */}
              <DriftDiffViewer
                result={result}
                maxHeight={300}
                selectedFields={selectedFields}
                onFieldSelect={handleFieldSelect}
              />

              {/* Selection info */}
              {selectedCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedCount} field{selectedCount === 1 ? '' : 's'} selected
                  for partial resolution
                </p>
              )}

              {/* Action Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ActionButton
                  variant="default"
                  icon={
                    <svg
                      className="h-5 w-5 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  title="Re-apply My Configuration"
                  description="Push your desired configuration to the router, overwriting the external changes."
                  onClick={() => setState('confirm-reapply')}
                  disabled={isResolving}
                />

                <ActionButton
                  variant="destructive"
                  icon={
                    <svg
                      className="h-5 w-5 text-error"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  title="Accept Router's State"
                  description="Update your configuration to match what's currently on the router."
                  onClick={() => setState('confirm-accept')}
                  disabled={isResolving}
                />
              </div>
            </div>
          )}

          {state === 'confirm-reapply' && (
            <div className="space-y-4 py-4">
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-info"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Confirm Re-apply
                </AlertTitle>
                <AlertDescription>
                  This will apply your configuration to the router, overwriting{' '}
                  {selectedCount > 0 ? `${selectedCount} selected` : 'all'}{' '}
                  drifted field{selectedCount === 1 ? '' : 's'}.
                  <br />
                  <br />
                  Any changes made directly on the router will be lost.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setState('diff')}
                  disabled={isResolving}
                >
                  Back
                </Button>
                <Button onClick={handleReapply} disabled={isResolving}>
                  {isResolving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Applying...
                    </>
                  ) : (
                    'Re-apply Configuration'
                  )}
                </Button>
              </div>
            </div>
          )}

          {state === 'confirm-accept' && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTitle className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Warning: This will modify your configuration
                </AlertTitle>
                <AlertDescription>
                  This will update your saved configuration to match the
                  router's current state for{' '}
                  {selectedCount > 0 ? `${selectedCount} selected` : 'all'}{' '}
                  drifted field{selectedCount === 1 ? '' : 's'}.
                  <br />
                  <br />
                  Your intended configuration changes will be lost.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setState('diff')}
                  disabled={isResolving}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleAccept}
                  disabled={isResolving}
                >
                  {isResolving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Accept Router's State"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - only show in diff view */}
        {state === 'diff' && (
          <DialogFooter className="px-6 py-4 border-t border-border">
            <Button variant="outline" onClick={handleDismiss}>
              Dismiss
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
