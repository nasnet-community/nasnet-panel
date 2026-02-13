/**
 * TemplatePreviewDesktop Component
 *
 * Desktop presenter for template preview.
 * Two-column layout: variables editor on left, preview on right.
 */

import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  cn,
} from '@nasnet/ui/primitives';
import { EmptyState } from '../empty-state';

import { TemplateVariableEditor } from './TemplateVariableEditor';
import type { UseTemplatePreviewReturn } from './use-template-preview';
import type { TemplateRule, TemplateConflict, ImpactAnalysis } from './template-preview.types';

export interface TemplatePreviewDesktopProps {
  /** Template preview hook return value */
  preview: UseTemplatePreviewReturn;

  /** Callback when Apply button is clicked */
  onApply?: () => void;

  /** Callback when Cancel button is clicked */
  onCancel?: () => void;

  /** Whether apply action is loading */
  isApplying?: boolean;

  /** Container className */
  className?: string;
}

/**
 * Rules preview panel
 */
interface RulesPreviewProps {
  rules: TemplateRule[];
}

function RulesPreview({ rules }: RulesPreviewProps) {
  if (rules.length === 0) {
    return (
      <EmptyState
        title="No rules to preview"
        description="Generate a preview to see the resolved rules."
      />
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((rule, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {rule.table}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {rule.chain}
              </Badge>
              <Badge
                variant={
                  rule.action === 'accept'
                    ? 'default'
                    : rule.action === 'drop'
                      ? 'destructive'
                      : 'outline'
                }
                className="text-xs"
              >
                {rule.action}
              </Badge>
            </div>
            {rule.position !== null && rule.position !== undefined && (
              <Badge variant="outline" className="text-xs">
                pos: {rule.position}
              </Badge>
            )}
          </div>

          {rule.comment && (
            <p className="text-sm text-muted-foreground mb-2">{rule.comment}</p>
          )}

          {Object.keys(rule.properties).length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(rule.properties).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/**
 * Conflicts preview panel
 */
interface ConflictsPreviewProps {
  conflicts: TemplateConflict[];
}

function ConflictsPreview({ conflicts }: ConflictsPreviewProps) {
  if (conflicts.length === 0) {
    return (
      <Alert>
        <AlertDescription>No conflicts detected. This template is safe to apply.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertDescription>
          {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} detected. Please
          review before applying.
        </AlertDescription>
      </Alert>

      {conflicts.map((conflict, index) => (
        <Card key={index} className="p-4 border-destructive">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="destructive">{conflict.type}</Badge>
            {conflict.existingRuleId && (
              <span className="text-xs text-muted-foreground">
                Conflicts with rule {conflict.existingRuleId}
              </span>
            )}
          </div>
          <p className="text-sm">{conflict.message}</p>

          {conflict.proposedRule && (
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-xs font-semibold mb-2">Proposed rule:</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {conflict.proposedRule.table}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {conflict.proposedRule.chain}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {conflict.proposedRule.action}
                </Badge>
              </div>
              {conflict.proposedRule.comment && (
                <p className="text-xs text-muted-foreground mt-2">
                  {conflict.proposedRule.comment}
                </p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/**
 * Impact analysis panel
 */
interface ImpactAnalysisViewProps {
  impactAnalysis: ImpactAnalysis;
}

function ImpactAnalysisView({ impactAnalysis }: ImpactAnalysisViewProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Impact Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">New Rules</p>
            <p className="text-2xl font-bold">{impactAnalysis.newRulesCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Affected Chains</p>
            <p className="text-2xl font-bold">{impactAnalysis.affectedChains.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Apply Time</p>
            <p className="text-2xl font-bold">{impactAnalysis.estimatedApplyTime}s</p>
          </div>
        </div>
      </Card>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Affected Chains</h3>
          <div className="flex flex-wrap gap-2">
            {impactAnalysis.affectedChains.map((chain) => (
              <Badge key={chain} variant="outline">
                {chain}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {impactAnalysis.warnings.length > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            <p className="font-semibold mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
              {impactAnalysis.warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Desktop presenter for TemplatePreview
 *
 * Features:
 * - Two-column layout (variables left, preview right)
 * - Tabbed preview (rules, conflicts, impact)
 * - Generate preview button
 * - Apply/Cancel actions
 * - Loading and error states
 */
export function TemplatePreviewDesktop({
  preview,
  onApply,
  onCancel,
  isApplying = false,
  className,
}: TemplatePreviewDesktopProps) {
  const {
    form,
    isValid,
    isDirty,
    previewResult,
    isGeneratingPreview,
    previewError,
    generatePreview,
    resetVariables,
    activeMode,
    setActiveMode,
    hasConflicts,
    hasWarnings,
    canApply,
  } = preview;

  const template = previewResult?.template || null;
  const variables = template?.variables || [];

  return (
    <div className={cn('flex gap-6 h-full', className)}>
      {/* Left Column: Variables Editor */}
      <div className="w-1/3 flex flex-col">
        <Card className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Template Variables</h2>
            <p className="text-sm text-muted-foreground">
              Configure the template parameters
            </p>
          </div>

          <TemplateVariableEditor
            variables={variables}
            form={form}
            disabled={isGeneratingPreview || isApplying}
          />

          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button
              onClick={generatePreview}
              disabled={!isValid || isGeneratingPreview || isApplying}
              className="flex-1"
            >
              {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
            </Button>
            <Button
              variant="outline"
              onClick={resetVariables}
              disabled={!isDirty || isGeneratingPreview || isApplying}
            >
              Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column: Preview */}
      <div className="flex-1 flex flex-col">
        <Card className="p-6 flex-1 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="text-sm text-muted-foreground">
              Review the resolved rules and conflicts
            </p>
          </div>

          {previewError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          )}

          {!previewResult ? (
            <EmptyState
              title="No preview generated"
              description="Configure the variables and click Generate Preview to see the resolved rules."
            />
          ) : (
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rules">
                  Rules
                  {previewResult.resolvedRules && (
                    <Badge variant="secondary" className="ml-2">
                      {previewResult.resolvedRules.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="conflicts">
                  Conflicts
                  {hasConflicts && (
                    <Badge variant="destructive" className="ml-2">
                      {previewResult.conflicts?.length || 0}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="impact">
                  Impact
                  {hasWarnings && (
                    <Badge variant="warning" className="ml-2">
                      ⚠
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="flex-1 overflow-y-auto mt-4">
                <RulesPreview rules={previewResult.resolvedRules || []} />
              </TabsContent>

              <TabsContent value="conflicts" className="flex-1 overflow-y-auto mt-4">
                <ConflictsPreview conflicts={previewResult.conflicts || []} />
              </TabsContent>

              <TabsContent value="impact" className="flex-1 overflow-y-auto mt-4">
                {previewResult.impactAnalysis && (
                  <ImpactAnalysisView impactAnalysis={previewResult.impactAnalysis} />
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          {previewResult && (
            <div className="flex gap-2 mt-6 pt-6 border-t">
              <Button
                onClick={onApply}
                disabled={!canApply || isApplying}
                className="flex-1"
                variant={hasConflicts ? 'destructive' : 'default'}
              >
                {isApplying ? 'Applying...' : hasConflicts ? 'Apply Anyway' : 'Apply Template'}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isApplying}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
