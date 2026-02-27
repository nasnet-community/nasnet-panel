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
    <Card className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border">
      <div className="gap-component-sm mb-component-sm flex items-start justify-between">
        <div className="gap-component-sm flex flex-wrap">
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
        <Badge
          variant="outline"
          className="rounded-[var(--semantic-radius-badge)] text-xs"
        >
          #{index + 1}
        </Badge>
      </div>

      {rule.comment && (
        <p className="text-muted-foreground mb-component-sm text-sm">{rule.comment}</p>
      )}

      {Object.keys(rule.properties).length > 0 && (
        <div className="space-y-component-sm text-xs">
          {Object.entries(rule.properties).map(([key, value]) => (
            <div
              key={key}
              className="gap-component-sm flex justify-between"
            >
              <span className="text-muted-foreground">{key}:</span>
              <span className="text-right font-mono">{String(value)}</span>
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
    <Card className="bg-card border-destructive p-component-sm rounded-[var(--semantic-radius-card)] border">
      <div className="gap-component-sm mb-component-sm flex items-start justify-between">
        <Badge
          variant="error"
          className="rounded-[var(--semantic-radius-badge)] text-xs"
        >
          {conflict.type}
        </Badge>
        <span className="text-muted-foreground text-xs">#{index + 1}</span>
      </div>

      <p className="mb-component-sm text-foreground text-sm">{conflict.message}</p>

      {conflict.existingRuleId && (
        <p className="text-muted-foreground mb-component-sm text-xs">
          Conflicts with rule {conflict.existingRuleId}
        </p>
      )}

      {conflict.proposedRule && (
        <div className="mt-component-sm p-component-sm bg-muted rounded-[var(--semantic-radius-button)]">
          <p className="mb-component-sm text-xs font-semibold">Proposed rule:</p>
          <div className="gap-component-sm flex flex-wrap">
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
      <div className="gap-component-sm grid grid-cols-3">
        <Card className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border text-center">
          <p className="text-muted-foreground mb-component-sm text-xs">Rules</p>
          <p className="text-foreground text-xl font-bold">{impactAnalysis.newRulesCount}</p>
        </Card>
        <Card className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border text-center">
          <p className="text-muted-foreground mb-component-sm text-xs">Chains</p>
          <p className="text-foreground text-xl font-bold">
            {impactAnalysis.affectedChains.length}
          </p>
        </Card>
        <Card className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border text-center">
          <p className="text-muted-foreground mb-component-sm text-xs">Time</p>
          <p className="text-foreground text-xl font-bold">{impactAnalysis.estimatedApplyTime}s</p>
        </Card>
      </div>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="bg-card border-border p-component-sm rounded-[var(--semantic-radius-card)] border">
          <p className="mb-component-sm text-foreground text-xs font-semibold">Affected Chains</p>
          <div className="gap-component-sm flex flex-wrap">
            {impactAnalysis.affectedChains.map((chain: string) => (
              <Badge
                key={chain}
                variant="outline"
                className="rounded-[var(--semantic-radius-badge)] text-xs"
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
            <p className="mb-component-sm text-xs font-semibold">Warnings:</p>
            <ul className="space-y-component-sm list-inside list-disc">
              {impactAnalysis.warnings.map((warning: string, index: number) => (
                <li
                  key={index}
                  className="text-xs"
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
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="p-component-md border-border bg-background border-b">
        <h2 className="font-display text-foreground text-lg font-semibold">Template Preview</h2>
        <p className="text-muted-foreground text-sm">Configure and preview template rules</p>
      </div>

      {/* Content */}
      <div className="p-component-md flex-1 overflow-y-auto">
        {previewError && (
          <Alert
            variant="destructive"
            className="mb-component-md"
          >
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}

        <Accordion
          type="multiple"
          defaultValue={['variables']}
          className="space-y-component-md"
        >
          {/* Variables Section */}
          <AccordionItem value="variables">
            <AccordionTrigger className="px-component-md bg-muted min-h-[44px] rounded-[var(--semantic-radius-button)]">
              <div className="gap-component-sm flex items-center">
                <span className="text-foreground font-semibold">Variables</span>
                <Badge
                  variant="secondary"
                  className="rounded-[var(--semantic-radius-badge)] text-xs"
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

              <div className="gap-component-sm mt-component-lg flex">
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
            </AccordionContent>
          </AccordionItem>

          {/* Rules Section */}
          {previewResult && (
            <AccordionItem value="rules">
              <AccordionTrigger className="px-component-md bg-muted min-h-[44px] rounded-[var(--semantic-radius-button)]">
                <div className="gap-component-sm flex items-center">
                  <span className="text-foreground font-semibold">Rules</span>
                  <Badge
                    variant="secondary"
                    className="rounded-[var(--semantic-radius-badge)] text-xs"
                  >
                    {previewResult.resolvedRules?.length || 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-component-md pt-component-md">
                {previewResult.resolvedRules && previewResult.resolvedRules.length > 0 ?
                  <div className="space-y-component-sm">
                    {(previewResult.resolvedRules as readonly TemplateRule[]).map(
                      (rule: TemplateRule, index: number) => (
                        <RuleCard
                          key={index}
                          rule={rule}
                          index={index}
                        />
                      )
                    )}
                  </div>
                : <EmptyState
                    icon={FileText}
                    title="No rules"
                    description="No rules found in this template."
                  />
                }
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Conflicts Section */}
          {previewResult && (
            <AccordionItem value="conflicts">
              <AccordionTrigger className="px-component-md bg-muted min-h-[44px] rounded-[var(--semantic-radius-button)]">
                <div className="gap-component-sm flex items-center">
                  <span className="text-foreground font-semibold">Conflicts</span>
                  {hasConflicts ?
                    <Badge
                      variant="error"
                      className="rounded-[var(--semantic-radius-badge)] text-xs"
                    >
                      {previewResult.conflicts?.length || 0}
                    </Badge>
                  : <Badge
                      variant="secondary"
                      className="rounded-[var(--semantic-radius-badge)] text-xs"
                    >
                      None
                    </Badge>
                  }
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-component-md pt-component-md">
                {previewResult.conflicts && previewResult.conflicts.length > 0 ?
                  <div className="space-y-component-sm">
                    <Alert
                      variant="destructive"
                      className="mb-component-md"
                    >
                      <AlertDescription>
                        {previewResult.conflicts.length} conflict(s) detected. Review before
                        applying.
                      </AlertDescription>
                    </Alert>
                    {previewResult.conflicts.map((conflict: TemplateConflict, index: number) => (
                      <ConflictCard
                        key={index}
                        conflict={conflict}
                        index={index}
                      />
                    ))}
                  </div>
                : <Alert>
                    <AlertDescription>
                      No conflicts detected. This template is safe to apply.
                    </AlertDescription>
                  </Alert>
                }
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Impact Section */}
          {previewResult?.impactAnalysis && (
            <AccordionItem value="impact">
              <AccordionTrigger className="px-component-md bg-muted min-h-[44px] rounded-[var(--semantic-radius-button)]">
                <div className="gap-component-sm flex items-center">
                  <span className="text-foreground font-semibold">Impact Analysis</span>
                  {hasWarnings && (
                    <Badge
                      variant="warning"
                      className="rounded-[var(--semantic-radius-badge)] text-xs"
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
        <div className="border-border p-component-md bg-background border-t">
          <div className="gap-component-sm flex flex-col">
            <Button
              onClick={onApply}
              disabled={!canApply || isApplying}
              className="min-h-[44px] w-full"
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
                className="min-h-[44px] w-full"
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
