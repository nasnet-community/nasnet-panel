/**
 * TemplatePreviewMobile Component
 *
 * Mobile presenter for template preview.
 * Accordion sections for variables, rules, conflicts, and impact.
 */

import { memo } from 'react';
import * as React from 'react';

import { FileText } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Alert,
  AlertDescription,
  cn,
} from '@nasnet/ui/primitives';

import { EmptyState } from '../empty-state';
import { TemplateVariableEditor } from './TemplateVariableEditor';

import type { TemplateRule, TemplateConflict, ImpactAnalysis } from './template-preview.types';
import type { UseTemplatePreviewReturn } from './use-template-preview';

export interface TemplatePreviewMobileProps {
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
 * Rule card for mobile view
 */
interface RuleCardProps {
  rule: TemplateRule;
  index: number;
}

function RuleCard({ rule, index }: RuleCardProps) {
  return (
    <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm">
      <div className="flex items-start justify-between gap-component-sm mb-component-sm">
        <div className="flex flex-wrap gap-component-sm">
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
        <Badge
          variant="outline"
          className="text-xs rounded-[var(--semantic-radius-badge)]"
        >
          #{index + 1}
        </Badge>
      </div>

      {rule.comment && (
        <p className="text-sm text-muted-foreground mb-component-sm">{rule.comment}</p>
      )}

      {Object.keys(rule.properties).length > 0 && (
        <div className="space-y-component-sm text-xs">
          {Object.entries(rule.properties).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-component-sm">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-mono text-right">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Conflict card for mobile view
 */
interface ConflictCardProps {
  conflict: TemplateConflict;
  index: number;
}

function ConflictCard({ conflict, index }: ConflictCardProps) {
  return (
    <Card className="bg-card border border-destructive rounded-[var(--semantic-radius-card)] p-component-sm">
      <div className="flex items-start justify-between gap-component-sm mb-component-sm">
        <Badge variant="error" className="text-xs rounded-[var(--semantic-radius-badge)]">
          {conflict.type}
        </Badge>
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
      </div>

      <p className="text-sm mb-component-sm text-foreground">{conflict.message}</p>

      {conflict.existingRuleId && (
        <p className="text-xs text-muted-foreground mb-component-sm">
          Conflicts with rule {conflict.existingRuleId}
        </p>
      )}

      {conflict.proposedRule && (
        <div className="mt-component-sm p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
          <p className="text-xs font-semibold mb-component-sm">Proposed rule:</p>
          <div className="flex flex-wrap gap-component-sm">
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
        </div>
      )}
    </Card>
  );
}

/**
 * Impact summary for mobile view
 */
interface ImpactSummaryProps {
  impactAnalysis: ImpactAnalysis;
}

function ImpactSummary({ impactAnalysis }: ImpactSummaryProps) {
  return (
    <div className="space-y-component-md">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-component-sm">
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm text-center">
          <p className="text-xs text-muted-foreground mb-component-sm">Rules</p>
          <p className="text-xl font-bold text-foreground">{impactAnalysis.newRulesCount}</p>
        </Card>
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm text-center">
          <p className="text-xs text-muted-foreground mb-component-sm">Chains</p>
          <p className="text-xl font-bold text-foreground">{impactAnalysis.affectedChains.length}</p>
        </Card>
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm text-center">
          <p className="text-xs text-muted-foreground mb-component-sm">Time</p>
          <p className="text-xl font-bold text-foreground">{impactAnalysis.estimatedApplyTime}s</p>
        </Card>
      </div>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-component-sm">
          <p className="text-xs font-semibold mb-component-sm text-foreground">Affected Chains</p>
          <div className="flex flex-wrap gap-component-sm">
            {impactAnalysis.affectedChains.map((chain: string) => (
              <Badge
                key={chain}
                variant="outline"
                className="text-xs rounded-[var(--semantic-radius-badge)]"
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
            <p className="font-semibold text-xs mb-component-sm">Warnings:</p>
            <ul className="list-disc list-inside space-y-component-sm">
              {impactAnalysis.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-xs">
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
 * Mobile presenter for TemplatePreview
 *
 * Features:
 * - Accordion sections (variables, rules, conflicts, impact)
 * - 44px minimum touch targets
 * - Vertical scrolling layout
 * - Generate preview button
 * - Apply/Cancel actions
 * - Loading and error states
 */
function TemplatePreviewMobileComponent({
  preview,
  onApply,
  onCancel,
  isApplying = false,
  className,
}: TemplatePreviewMobileProps) {
  const {
    form,
    isValid,
    isDirty,
    previewResult,
    isGeneratingPreview,
    previewError,
    generatePreview,
    resetVariables,
    hasConflicts,
    hasWarnings,
    canApply,
  } = preview;

  const template = previewResult?.template || null;
  const variables = template?.variables || [];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-component-md border-b border-border bg-background">
        <h2 className="text-lg font-semibold font-display text-foreground">Template Preview</h2>
        <p className="text-sm text-muted-foreground">Configure and preview template rules</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-component-md">
        {previewError && (
          <Alert variant="destructive" className="mb-component-md">
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}

        <Accordion type="multiple" defaultValue={['variables']} className="space-y-component-md">
          {/* Variables Section */}
          <AccordionItem value="variables">
            <AccordionTrigger className="min-h-[44px] px-component-md bg-muted rounded-[var(--semantic-radius-button)]">
              <div className="flex items-center gap-component-sm">
                <span className="font-semibold text-foreground">Variables</span>
                <Badge
                  variant="secondary"
                  className="text-xs rounded-[var(--semantic-radius-badge)]"
                >
                  {variables.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-component-md pt-component-md">
              <TemplateVariableEditor
                variables={variables}
                form={form}
                disabled={isGeneratingPreview || isApplying}
              />

              <div className="flex gap-component-sm mt-component-lg">
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
            </AccordionContent>
          </AccordionItem>

          {/* Rules Section */}
          {previewResult && (
            <AccordionItem value="rules">
              <AccordionTrigger className="min-h-[44px] px-component-md bg-muted rounded-[var(--semantic-radius-button)]">
                <div className="flex items-center gap-component-sm">
                  <span className="font-semibold text-foreground">Rules</span>
                  <Badge
                    variant="secondary"
                    className="text-xs rounded-[var(--semantic-radius-badge)]"
                  >
                    {previewResult.resolvedRules?.length || 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-component-md pt-component-md">
                {previewResult.resolvedRules && previewResult.resolvedRules.length > 0 ? (
                  <div className="space-y-component-sm">
                    {(previewResult.resolvedRules as readonly TemplateRule[]).map((rule: TemplateRule, index: number) => (
                      <RuleCard key={index} rule={rule} index={index} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No rules"
                    description="No rules found in this template."
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Conflicts Section */}
          {previewResult && (
            <AccordionItem value="conflicts">
              <AccordionTrigger className="min-h-[44px] px-component-md bg-muted rounded-[var(--semantic-radius-button)]">
                <div className="flex items-center gap-component-sm">
                  <span className="font-semibold text-foreground">Conflicts</span>
                  {hasConflicts ? (
                    <Badge
                      variant="error"
                      className="text-xs rounded-[var(--semantic-radius-badge)]"
                    >
                      {previewResult.conflicts?.length || 0}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs rounded-[var(--semantic-radius-badge)]"
                    >
                      None
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-component-md pt-component-md">
                {previewResult.conflicts && previewResult.conflicts.length > 0 ? (
                  <div className="space-y-component-sm">
                    <Alert variant="destructive" className="mb-component-md">
                      <AlertDescription>
                        {previewResult.conflicts.length} conflict(s) detected. Review before
                        applying.
                      </AlertDescription>
                    </Alert>
                    {previewResult.conflicts.map((conflict: TemplateConflict, index: number) => (
                      <ConflictCard key={index} conflict={conflict} index={index} />
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No conflicts detected. This template is safe to apply.
                    </AlertDescription>
                  </Alert>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Impact Section */}
          {previewResult?.impactAnalysis && (
            <AccordionItem value="impact">
              <AccordionTrigger className="min-h-[44px] px-component-md bg-muted rounded-[var(--semantic-radius-button)]">
                <div className="flex items-center gap-component-sm">
                  <span className="font-semibold text-foreground">Impact Analysis</span>
                  {hasWarnings && (
                    <Badge
                      variant="warning"
                      className="text-xs rounded-[var(--semantic-radius-badge)]"
                    >
                      ⚠
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-component-md pt-component-md">
                <ImpactSummary impactAnalysis={previewResult.impactAnalysis} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {!previewResult && (
          <EmptyState
            icon={FileText}
            title="No preview generated"
            description="Configure the variables and generate a preview to see the resolved rules."
            className="mt-component-xl"
          />
        )}
      </div>

      {/* Action Buttons (Fixed Footer) */}
      {previewResult && (
        <div className="border-t border-border p-component-md bg-background">
          <div className="flex flex-col gap-component-sm">
            <Button
              onClick={onApply}
              disabled={!canApply || isApplying}
              className="w-full min-h-[44px]"
              variant={hasConflicts ? 'destructive' : 'default'}
            >
              {isApplying ? 'Applying...' : hasConflicts ? 'Apply Anyway' : 'Apply Template'}
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isApplying}
                className="w-full min-h-[44px]"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with memo for performance optimization
export const TemplatePreviewMobile = memo(TemplatePreviewMobileComponent);

// Set display name for React DevTools
TemplatePreviewMobile.displayName = 'TemplatePreviewMobile';
