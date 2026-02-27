/**
 * TemplatePreviewDesktop Component
 *
 * Desktop presenter for template preview.
 * Two-column layout: variables editor on left, preview on right.
 */

import { memo } from 'react';
import * as React from 'react';

import { FileText } from 'lucide-react';

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

import type { TemplateRule, TemplateConflict, ImpactAnalysis } from './template-preview.types';
import type { UseTemplatePreviewReturn } from './use-template-preview';

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
  rules: readonly TemplateRule[];
}

function RulesPreview({ rules }: RulesPreviewProps) {
  if (rules.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No rules to preview"
        description="Generate a preview to see the resolved rules."
      />
    );
  }

  return (
    <div className="space-y-component-sm">
      {rules.map((rule, index) => (
        <Card
          key={index}
          className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm"
        >
          <div className="flex items-start justify-between gap-component-sm mb-component-sm">
            <div className="flex items-center gap-component-sm">
              <Badge
                variant="outline"
                className="text-xs rounded-[var(--semantic-radius-badge)]"
              >
                {rule.table}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs rounded-[var(--semantic-radius-badge)]"
              >
                {rule.chain}
              </Badge>
              <Badge
                variant={
                  rule.action === 'accept'
                    ? 'default'
                    : rule.action === 'drop'
                      ? 'error'
                      : 'outline'
                }
                className="text-xs rounded-[var(--semantic-radius-badge)]"
              >
                {rule.action}
              </Badge>
            </div>
            {rule.position !== null && rule.position !== undefined && (
              <Badge
                variant="outline"
                className="text-xs rounded-[var(--semantic-radius-badge)]"
              >
                pos: {rule.position}
              </Badge>
            )}
          </div>

          {rule.comment && (
            <p className="text-sm text-muted-foreground mb-component-sm">{rule.comment}</p>
          )}

          {Object.keys(rule.properties).length > 0 && (
            <div className="grid grid-cols-2 gap-component-sm text-xs">
              {Object.entries(rule.properties).map(([key, value]) => (
                <div key={key} className="flex items-start gap-component-sm">
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
  conflicts: readonly TemplateConflict[];
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
    <div className="space-y-component-md">
      <Alert variant="destructive">
        <AlertDescription>
          {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} detected. Please
          review before applying.
        </AlertDescription>
      </Alert>

      {conflicts.map((conflict, index) => (
        <Card
          key={index}
          className="bg-card border border-destructive rounded-[var(--semantic-radius-card)] p-component-md"
        >
          <div className="flex items-start justify-between gap-component-sm mb-component-sm">
            <Badge variant="error" className="rounded-[var(--semantic-radius-badge)]">
              {conflict.type}
            </Badge>
            {conflict.existingRuleId && (
              <span className="text-xs text-muted-foreground">
                Conflicts with rule {conflict.existingRuleId}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{conflict.message}</p>

          {conflict.proposedRule && (
            <div className="mt-component-md p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
              <p className="text-xs font-semibold mb-component-sm text-foreground">Proposed rule:</p>
              <div className="flex gap-component-sm">
                <Badge
                  variant="outline"
                  className="text-xs rounded-[var(--semantic-radius-badge)]"
                >
                  {conflict.proposedRule.table}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs rounded-[var(--semantic-radius-badge)]"
                >
                  {conflict.proposedRule.chain}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs rounded-[var(--semantic-radius-badge)]"
                >
                  {conflict.proposedRule.action}
                </Badge>
              </div>
              {conflict.proposedRule.comment && (
                <p className="text-xs text-muted-foreground mt-component-sm">
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
    <div className="space-y-component-lg">
      {/* Summary */}
      <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-md">
        <h3 className="font-semibold mb-component-md text-foreground">Impact Summary</h3>
        <div className="grid grid-cols-3 gap-component-lg text-sm">
          <div>
            <p className="text-muted-foreground mb-component-sm">New Rules</p>
            <p className="text-2xl font-bold text-foreground">{impactAnalysis.newRulesCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-component-sm">Affected Chains</p>
            <p className="text-2xl font-bold text-foreground">{impactAnalysis.affectedChains.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-component-sm">Apply Time</p>
            <p className="text-2xl font-bold text-foreground">{impactAnalysis.estimatedApplyTime}s</p>
          </div>
        </div>
      </Card>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-md">
          <h3 className="font-semibold mb-component-md text-foreground">Affected Chains</h3>
          <div className="flex flex-wrap gap-component-sm">
            {impactAnalysis.affectedChains.map((chain: string) => (
              <Badge
                key={chain}
                variant="outline"
                className="rounded-[var(--semantic-radius-badge)]"
              >
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
            <p className="font-semibold mb-component-sm">Warnings:</p>
            <ul className="list-disc list-inside space-y-component-sm">
              {impactAnalysis.warnings.map((warning: string, index: number) => (
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
function TemplatePreviewDesktopComponent({
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
    <div className={cn('flex gap-component-lg h-full', className)}>
      {/* Left Column: Variables Editor */}
      <div className="w-1/3 flex flex-col">
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)] p-component-lg flex-1 overflow-y-auto">
          <div className="mb-component-lg">
            <h2 className="text-lg font-semibold font-display text-foreground">Template Variables</h2>
            <p className="text-sm text-muted-foreground">
              Configure the template parameters
            </p>
          </div>

          <TemplateVariableEditor
            variables={[...variables]}
            form={form}
            disabled={isGeneratingPreview || isApplying}
          />

          <div className="flex gap-component-sm mt-component-xl pt-component-lg border-t border-border">
            <Button
              onClick={generatePreview}
              disabled={!isValid || isGeneratingPreview || isApplying}
              className="flex-1 min-h-[44px]"
            >
              {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
            </Button>
            <Button
              variant="outline"
              onClick={resetVariables}
              disabled={!isDirty || isGeneratingPreview || isApplying}
              className="min-h-[44px]"
            >
              Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Column: Preview */}
      <div className="flex-1 flex flex-col">
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] shadow-[var(--semantic-shadow-card)] p-component-lg flex-1 flex flex-col">
          <div className="mb-component-lg">
            <h2 className="text-lg font-semibold font-display text-foreground">Preview</h2>
            <p className="text-sm text-muted-foreground">
              Review the resolved rules and conflicts
            </p>
          </div>

          {previewError && (
            <Alert variant="destructive" className="mb-component-lg">
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          )}

          {!previewResult ? (
            <EmptyState
              icon={FileText}
              title="No preview generated"
              description="Configure the variables and click Generate Preview to see the resolved rules."
            />
          ) : (
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as any)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rules">
                  Rules
                  {previewResult.resolvedRules && (
                    <Badge
                      variant="secondary"
                      className="ml-component-sm rounded-[var(--semantic-radius-badge)]"
                    >
                      {previewResult.resolvedRules.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="conflicts">
                  Conflicts
                  {hasConflicts && (
                    <Badge
                      variant="error"
                      className="ml-component-sm rounded-[var(--semantic-radius-badge)]"
                    >
                      {previewResult.conflicts?.length || 0}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="impact">
                  Impact
                  {hasWarnings && (
                    <Badge
                      variant="warning"
                      className="ml-component-sm rounded-[var(--semantic-radius-badge)]"
                    >
                      ⚠
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="flex-1 overflow-y-auto mt-component-md">
                <RulesPreview rules={[...(previewResult.resolvedRules || [])]} />
              </TabsContent>

              <TabsContent value="conflicts" className="flex-1 overflow-y-auto mt-component-md">
                <ConflictsPreview conflicts={[...(previewResult.conflicts || [])]} />
              </TabsContent>

              <TabsContent value="impact" className="flex-1 overflow-y-auto mt-component-md">
                {previewResult.impactAnalysis && (
                  <ImpactAnalysisView impactAnalysis={previewResult.impactAnalysis} />
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          {previewResult && (
            <div className="flex gap-component-sm mt-component-xl pt-component-lg border-t border-border">
              <Button
                onClick={onApply}
                disabled={!canApply || isApplying}
                className="flex-1 min-h-[44px]"
                variant={hasConflicts ? 'destructive' : 'default'}
              >
                {isApplying ? 'Applying...' : hasConflicts ? 'Apply Anyway' : 'Apply Template'}
              </Button>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isApplying}
                  className="min-h-[44px]"
                >
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

// Wrap with memo for performance optimization
export const TemplatePreviewDesktop = memo(TemplatePreviewDesktopComponent);

// Set display name for React DevTools
TemplatePreviewDesktop.displayName = 'TemplatePreviewDesktop';
