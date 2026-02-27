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
          className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border"
        >
          <div className="gap-component-sm mb-component-sm flex items-start justify-between">
            <div className="gap-component-sm flex items-center">
              <Badge
                variant="outline"
                className="rounded-[var(--semantic-radius-badge)] text-xs"
              >
                {rule.table}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-[var(--semantic-radius-badge)] text-xs"
              >
                {rule.chain}
              </Badge>
              <Badge
                variant={
                  rule.action === 'accept' ? 'default'
                  : rule.action === 'drop' ?
                    'error'
                  : 'outline'
                }
                className="rounded-[var(--semantic-radius-badge)] text-xs"
              >
                {rule.action}
              </Badge>
            </div>
            {rule.position !== null && rule.position !== undefined && (
              <Badge
                variant="outline"
                className="rounded-[var(--semantic-radius-badge)] text-xs"
              >
                pos: {rule.position}
              </Badge>
            )}
          </div>

          {rule.comment && (
            <p className="text-muted-foreground mb-component-sm text-sm">{rule.comment}</p>
          )}

          {Object.keys(rule.properties).length > 0 && (
            <div className="gap-component-sm grid grid-cols-2 text-xs">
              {Object.entries(rule.properties).map(([key, value]) => (
                <div
                  key={key}
                  className="gap-component-sm flex items-start"
                >
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
          className="bg-card border-destructive p-component-md rounded-[var(--semantic-radius-card)] border"
        >
          <div className="gap-component-sm mb-component-sm flex items-start justify-between">
            <Badge
              variant="error"
              className="rounded-[var(--semantic-radius-badge)]"
            >
              {conflict.type}
            </Badge>
            {conflict.existingRuleId && (
              <span className="text-muted-foreground text-xs">
                Conflicts with rule {conflict.existingRuleId}
              </span>
            )}
          </div>
          <p className="text-foreground text-sm">{conflict.message}</p>

          {conflict.proposedRule && (
            <div className="mt-component-md p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
              <p className="mb-component-sm text-foreground text-xs font-semibold">
                Proposed rule:
              </p>
              <div className="gap-component-sm flex">
                <Badge
                  variant="outline"
                  className="rounded-[var(--semantic-radius-badge)] text-xs"
                >
                  {conflict.proposedRule.table}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-[var(--semantic-radius-badge)] text-xs"
                >
                  {conflict.proposedRule.chain}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-[var(--semantic-radius-badge)] text-xs"
                >
                  {conflict.proposedRule.action}
                </Badge>
              </div>
              {conflict.proposedRule.comment && (
                <p className="text-muted-foreground mt-component-sm text-xs">
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
      <Card className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
        <h3 className="mb-component-md text-foreground font-semibold">Impact Summary</h3>
        <div className="gap-component-lg grid grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground mb-component-sm">New Rules</p>
            <p className="text-foreground text-2xl font-bold">{impactAnalysis.newRulesCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-component-sm">Affected Chains</p>
            <p className="text-foreground text-2xl font-bold">
              {impactAnalysis.affectedChains.length}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-component-sm">Apply Time</p>
            <p className="text-foreground text-2xl font-bold">
              {impactAnalysis.estimatedApplyTime}s
            </p>
          </div>
        </div>
      </Card>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="bg-card border-border p-component-md rounded-[var(--semantic-radius-card)] border">
          <h3 className="mb-component-md text-foreground font-semibold">Affected Chains</h3>
          <div className="gap-component-sm flex flex-wrap">
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
            <p className="mb-component-sm font-semibold">Warnings:</p>
            <ul className="space-y-component-sm list-inside list-disc">
              {impactAnalysis.warnings.map((warning: string, index: number) => (
                <li
                  key={index}
                  className="text-sm"
                >
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
    <div className={cn('gap-component-lg flex h-full', className)}>
      {/* Left Column: Variables Editor */}
      <div className="flex w-1/3 flex-col">
        <Card className="bg-card border-border p-component-lg flex-1 overflow-y-auto rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)]">
          <div className="mb-component-lg">
            <h2 className="font-display text-foreground text-lg font-semibold">
              Template Variables
            </h2>
            <p className="text-muted-foreground text-sm">Configure the template parameters</p>
          </div>

          <TemplateVariableEditor
            variables={[...variables]}
            form={form}
            disabled={isGeneratingPreview || isApplying}
          />

          <div className="gap-component-sm mt-component-xl pt-component-lg border-border flex border-t">
            <Button
              onClick={generatePreview}
              disabled={!isValid || isGeneratingPreview || isApplying}
              className="min-h-[44px] flex-1"
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
      <div className="flex flex-1 flex-col">
        <Card className="bg-card border-border p-component-lg flex flex-1 flex-col rounded-[var(--semantic-radius-card)] border shadow-[var(--semantic-shadow-card)]">
          <div className="mb-component-lg">
            <h2 className="font-display text-foreground text-lg font-semibold">Preview</h2>
            <p className="text-muted-foreground text-sm">Review the resolved rules and conflicts</p>
          </div>

          {previewError && (
            <Alert
              variant="destructive"
              className="mb-component-lg"
            >
              <AlertDescription>{previewError}</AlertDescription>
            </Alert>
          )}

          {!previewResult ?
            <EmptyState
              icon={FileText}
              title="No preview generated"
              description="Configure the variables and click Generate Preview to see the resolved rules."
            />
          : <Tabs
              value={activeMode}
              onValueChange={(v) => setActiveMode(v as any)}
              className="flex flex-1 flex-col"
            >
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

              <TabsContent
                value="rules"
                className="mt-component-md flex-1 overflow-y-auto"
              >
                <RulesPreview rules={[...(previewResult.resolvedRules || [])]} />
              </TabsContent>

              <TabsContent
                value="conflicts"
                className="mt-component-md flex-1 overflow-y-auto"
              >
                <ConflictsPreview conflicts={[...(previewResult.conflicts || [])]} />
              </TabsContent>

              <TabsContent
                value="impact"
                className="mt-component-md flex-1 overflow-y-auto"
              >
                {previewResult.impactAnalysis && (
                  <ImpactAnalysisView impactAnalysis={previewResult.impactAnalysis} />
                )}
              </TabsContent>
            </Tabs>
          }

          {/* Action Buttons */}
          {previewResult && (
            <div className="gap-component-sm mt-component-xl pt-component-lg border-border flex border-t">
              <Button
                onClick={onApply}
                disabled={!canApply || isApplying}
                className="min-h-[44px] flex-1"
                variant={hasConflicts ? 'destructive' : 'default'}
              >
                {isApplying ?
                  'Applying...'
                : hasConflicts ?
                  'Apply Anyway'
                : 'Apply Template'}
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
