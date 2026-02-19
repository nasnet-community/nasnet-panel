/**
 * TemplateApplyFlow - XState-driven template application flow
 *
 * Features:
 * - XState machine integration with useMachine() hook
 * - Safety Pipeline with dangerous operation confirmation
 * - Multi-state UI rendering (configuring, previewing, confirming, applying, success)
 * - Undo functionality with UndoFloatingButton
 * - Error handling and recovery
 *
 * @module @nasnet/features/firewall/components
 */

import { useMachine } from '@xstate/react';
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives/button';
import { Alert, AlertDescription, AlertTitle } from '@nasnet/ui/primitives/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives/dialog';
import { Checkbox } from '@nasnet/ui/primitives/checkbox';
import { Label } from '@nasnet/ui/primitives/label';
import { Badge } from '@nasnet/ui/primitives/badge';
import { Separator } from '@nasnet/ui/primitives/separator';
import { ScrollArea } from '@nasnet/ui/primitives/scroll-area';
import { TemplatePreview } from '@nasnet/ui/patterns';
import { useTemplatePreview } from '@nasnet/ui/patterns/template-preview';
import { createTemplateApplyMachine } from '../machines/template-apply.machine';
import { UndoFloatingButton } from './UndoFloatingButton';
import type { FirewallTemplate } from '../schemas/templateSchemas';
import { useState, useCallback, useMemo } from 'react';

// ============================================
// COMPONENT PROPS
// ============================================

export interface TemplateApplyFlowProps {
  /** Router ID to apply template to */
  routerId: string;

  /** Template to apply */
  template: FirewallTemplate | null;

  /** Callback to preview template */
  onPreview: (params: {
    routerId: string;
    template: FirewallTemplate;
    variables: Record<string, string>;
  }) => Promise<any>;

  /** Callback to apply template */
  onApply: (params: {
    routerId: string;
    template: FirewallTemplate;
    variables: Record<string, string>;
  }) => Promise<any>;

  /** Callback to execute rollback */
  onRollback: (params: { routerId: string; rollbackId: string }) => Promise<void>;

  /** Callback on success */
  onSuccess?: () => void;

  /** Callback on cancel */
  onCancel?: () => void;

  /** Callback on rollback complete */
  onRollbackComplete?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function TemplateApplyFlow({
  routerId,
  template,
  onPreview,
  onApply,
  onRollback,
  onSuccess,
  onCancel,
  onRollbackComplete,
}: TemplateApplyFlowProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Create XState machine
  const machine = useMemo(
    () =>
      createTemplateApplyMachine({
        previewTemplate: onPreview,
        applyTemplate: onApply,
        executeRollback: onRollback,
        onSuccess,
        onRollback: onRollbackComplete,
      }),
    [onPreview, onApply, onRollback, onSuccess, onRollbackComplete]
  );

  // Initialize machine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, send] = useMachine(machine) as unknown as [any, any];

  // Initialize template preview hook
  const preview = useTemplatePreview({
    template: template || ({} as FirewallTemplate),
    onGeneratePreview: async (variables) => {
      // Trigger XState machine to preview
      send({ type: 'PREVIEW' });
      return state.context.previewResult;
    },
  });

  const handleCancel = useCallback(() => {
    send({ type: 'CANCEL' });
    onCancel?.();
  }, [send, onCancel]);

  const handlePreview = useCallback(async () => {
    if (!template) return;

    // Update machine variables
    send({
      type: 'UPDATE_VARIABLES',
      variables: preview.variables as Record<string, string>,
    });

    // Trigger preview
    send({ type: 'PREVIEW' });
  }, [template, preview.variables, send]);

  const handleConfirm = useCallback(() => {
    send({ type: 'CONFIRM' });
  }, [send]);

  const handleAcknowledge = useCallback(() => {
    if (acknowledged) {
      send({ type: 'ACKNOWLEDGED' });
    }
  }, [acknowledged, send]);

  const handleRollbackClick = useCallback(async () => {
    send({ type: 'ROLLBACK' });
  }, [send]);

  const handleRetry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  const handleReset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  if (!template) {
    return null;
  }

  // Machine state rendering

  // CONFIGURING STATE
  if (state.matches('configuring')) {
    return (
      <div className="space-y-6">
        <TemplatePreview
          preview={preview}
          onApply={handlePreview}
          onCancel={handleCancel}
          isApplying={false}
        />
      </div>
    );
  }

  // PREVIEWING STATE
  if (state.matches('previewing')) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12" role="status" aria-label="Generating template preview">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <p className="text-lg font-medium">Generating preview...</p>
        <p className="text-sm text-muted-foreground">
          Analyzing template and detecting conflicts
        </p>
      </div>
    );
  }

  // REVIEWING STATE
  if (state.matches('reviewing')) {
    const previewResult = state.context.previewResult;

    return (
      <div className="space-y-6">
        {/* Preview Results */}
        {previewResult && (
          <div className="space-y-4">
            {/* Impact Analysis */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-lg font-semibold">Impact Analysis</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">New Rules</p>
                  <p className="text-2xl font-bold">{previewResult.impactAnalysis.newRulesCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Affected Chains</p>
                  <p className="text-2xl font-bold">
                    {previewResult.impactAnalysis.affectedChains.length}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Estimated Apply Time</p>
                <p className="text-lg font-medium">
                  {previewResult.impactAnalysis.estimatedApplyTime}s
                </p>
              </div>
            </div>

            {/* Conflicts */}
            {previewResult.conflicts.length > 0 && (
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                <AlertTitle>Conflicts Detected</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {previewResult.conflicts.map((conflict: { message: string }, i: number) => (
                      <li key={i} className="text-sm">
                        {conflict.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {previewResult.impactAnalysis.warnings.length > 0 && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {(previewResult.impactAnalysis.warnings as string[]).map((warning: string, i: number) => (
                      <li key={i} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} aria-label="Cancel template application">
            Cancel
          </Button>
          <Button onClick={handleConfirm} aria-label="Apply template to firewall">
            {state.context.previewResult?.conflicts.length ?? 0 > 0
              ? 'Apply Anyway'
              : 'Apply Template'}
          </Button>
        </div>
      </div>
    );
  }

  // CONFIRMING STATE (Safety Pipeline - Dangerous Operation)
  if (state.matches('confirming')) {
    const previewResult = state.context.previewResult;
    const isHighRisk =
      (previewResult?.impactAnalysis.newRulesCount ?? 0) > 10 ||
      (previewResult?.impactAnalysis.affectedChains.length ?? 0) > 3 ||
      (previewResult?.conflicts.length ?? 0) > 0;

    return (
      <Dialog open={true} onOpenChange={(open: boolean) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              High-Risk Operation
            </DialogTitle>
            <DialogDescription>
              This template will make significant changes to your firewall configuration.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              {/* Risk Indicators */}
              <div className="rounded-lg border-2 border-warning bg-warning/10 p-4">
                <h4 className="mb-3 font-semibold">Risk Factors</h4>
                <div className="space-y-2">
                  {(previewResult?.impactAnalysis.newRulesCount ?? 0) > 10 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="error">High Rule Count</Badge>
                      <span className="text-sm">
                        {previewResult?.impactAnalysis.newRulesCount} rules will be created
                      </span>
                    </div>
                  )}
                  {(previewResult?.impactAnalysis.affectedChains.length ?? 0) > 3 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="error">Multiple Chains</Badge>
                      <span className="text-sm">
                        {previewResult?.impactAnalysis.affectedChains.length} chains affected
                      </span>
                    </div>
                  )}
                  {(previewResult?.conflicts.length ?? 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="error">Conflicts</Badge>
                      <span className="text-sm">
                        {previewResult?.conflicts.length} conflicts detected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {(previewResult?.impactAnalysis.warnings.length ?? 0) > 0 && (
                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {(previewResult?.impactAnalysis.warnings as string[])?.map((warning: string, i: number) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Acknowledgment Checkbox */}
              <div className="flex items-start space-x-3 rounded-lg border bg-muted p-4">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="acknowledge"
                    className="cursor-pointer text-base font-medium leading-none"
                  >
                    I understand this will modify my firewall rules
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    You can undo these changes within 5 minutes after applying.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => send({ type: 'CANCEL' })} aria-label="Cancel template application">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleAcknowledge}
              disabled={!acknowledged}
              aria-label="Acknowledge risks and apply template"
            >
              <ShieldAlert className="mr-2 h-4 w-4" aria-hidden="true" />
              I Understand - Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // APPLYING STATE
  if (state.matches('applying')) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12" role="status" aria-label="Applying template">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <p className="text-lg font-medium">Applying template...</p>
        <p className="text-sm text-muted-foreground">
          Creating {state.context.previewResult?.impactAnalysis.newRulesCount} firewall rules
        </p>
      </div>
    );
  }

  // SUCCESS STATE
  if (state.matches('success')) {
    const applyResult = state.context.applyResult;

    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
          <h2 className="text-2xl font-bold">Template Applied Successfully!</h2>
          <p className="text-muted-foreground">
            {applyResult?.appliedRulesCount} firewall rules have been created
          </p>
        </div>

        {/* Undo Button */}
        {applyResult?.rollbackId && (
          <UndoFloatingButton
            onRollback={async () => {
              await onRollback({ routerId, rollbackId: applyResult.rollbackId });
            }}
            onExpire={() => send({ type: 'RESET' })}
            templateName={template.name}
            rulesApplied={applyResult.appliedRulesCount}
          />
        )}

        <div className="flex justify-center">
          <Button onClick={handleReset} aria-label="Finish and return">Done</Button>
        </div>
      </div>
    );
  }

  // ROLLING_BACK STATE
  if (state.matches('rollingBack')) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12" role="status" aria-label="Rolling back changes">
        <Loader2 className="h-12 w-12 animate-spin text-warning" aria-hidden="true" />
        <p className="text-lg font-medium">Rolling back changes...</p>
        <p className="text-sm text-muted-foreground">
          Restoring firewall configuration to previous state
        </p>
      </div>
    );
  }

  // ROLLED_BACK STATE
  if (state.matches('rolledBack')) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
          <h2 className="text-2xl font-bold">Changes Rolled Back</h2>
          <p className="text-muted-foreground">
            Firewall configuration restored to previous state
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleReset} aria-label="Finish and return after rollback">Done</Button>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (state.matches('error')) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {state.context.errorMessage || 'An unknown error occurred'}
          </AlertDescription>
        </Alert>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset} aria-label="Cancel and reset">
            Cancel
          </Button>
          {state.context.applyResult?.rollbackId && (
            <Button variant="destructive" onClick={handleRollbackClick} aria-label="Rollback firewall changes">
              Rollback Changes
            </Button>
          )}
          <Button onClick={handleRetry} aria-label="Retry template application">Retry</Button>
        </div>
      </div>
    );
  }

  // IDLE STATE
  return null;
}
