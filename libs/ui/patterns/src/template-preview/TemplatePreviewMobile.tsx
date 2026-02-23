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
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1">
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
                  ? 'error'
                  : 'outline'
            }
            className="text-xs"
          >
            {rule.action}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          #{index + 1}
        </Badge>
      </div>

      {rule.comment && (
        <p className="text-sm text-muted-foreground mb-2">{rule.comment}</p>
      )}

      {Object.keys(rule.properties).length > 0 && (
        <div className="space-y-1 text-xs">
          {Object.entries(rule.properties).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
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
    <Card className="p-3 border-destructive">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="error" className="text-xs">
          {conflict.type}
        </Badge>
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
      </div>

      <p className="text-sm mb-2">{conflict.message}</p>

      {conflict.existingRuleId && (
        <p className="text-xs text-muted-foreground mb-2">
          Conflicts with rule {conflict.existingRuleId}
        </p>
      )}

      {conflict.proposedRule && (
        <div className="mt-2 p-2 bg-muted rounded-md">
          <p className="text-xs font-semibold mb-1">Proposed rule:</p>
          <div className="flex flex-wrap gap-1">
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
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Rules</p>
          <p className="text-xl font-bold">{impactAnalysis.newRulesCount}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Chains</p>
          <p className="text-xl font-bold">{impactAnalysis.affectedChains.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Time</p>
          <p className="text-xl font-bold">{impactAnalysis.estimatedApplyTime}s</p>
        </Card>
      </div>

      {/* Affected chains */}
      {impactAnalysis.affectedChains.length > 0 && (
        <Card className="p-3">
          <p className="text-xs font-semibold mb-2">Affected Chains</p>
          <div className="flex flex-wrap gap-1">
            {impactAnalysis.affectedChains.map((chain: string) => (
              <Badge key={chain} variant="outline" className="text-xs">
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
            <p className="font-semibold text-xs mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1">
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
      <div className="p-4 border-b bg-background">
        <h2 className="text-lg font-semibold">Template Preview</h2>
        <p className="text-sm text-muted-foreground">Configure and preview template rules</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {previewError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        )}

        <Accordion type="multiple" defaultValue={['variables']} className="space-y-3">
          {/* Variables Section */}
          <AccordionItem value="variables">
            <AccordionTrigger className="min-h-[44px] px-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Variables</span>
                <Badge variant="secondary" className="text-xs">
                  {variables.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-4">
              <TemplateVariableEditor
                variables={variables}
                form={form}
                disabled={isGeneratingPreview || isApplying}
              />

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={generatePreview}
                  disabled={!isValid || isGeneratingPreview || isApplying}
                  className="flex-1 h-11"
                >
                  {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetVariables}
                  disabled={!isDirty || isGeneratingPreview || isApplying}
                  className="h-11"
                >
                  Reset
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rules Section */}
          {previewResult && (
            <AccordionItem value="rules">
              <AccordionTrigger className="min-h-[44px] px-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Rules</span>
                  <Badge variant="secondary" className="text-xs">
                    {previewResult.resolvedRules?.length || 0}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4">
                {previewResult.resolvedRules && previewResult.resolvedRules.length > 0 ? (
                  <div className="space-y-2">
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
              <AccordionTrigger className="min-h-[44px] px-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Conflicts</span>
                  {hasConflicts ? (
                    <Badge variant="error" className="text-xs">
                      {previewResult.conflicts?.length || 0}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      None
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4">
                {previewResult.conflicts && previewResult.conflicts.length > 0 ? (
                  <div className="space-y-2">
                    <Alert variant="destructive" className="mb-3">
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
              <AccordionTrigger className="min-h-[44px] px-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Impact Analysis</span>
                  {hasWarnings && (
                    <Badge variant="warning" className="text-xs">
                      ⚠
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4">
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
            className="mt-8"
          />
        )}
      </div>

      {/* Action Buttons (Fixed Footer) */}
      {previewResult && (
        <div className="border-t p-4 bg-background">
          <div className="flex flex-col gap-2">
            <Button
              onClick={onApply}
              disabled={!canApply || isApplying}
              className="w-full h-11"
              variant={hasConflicts ? 'destructive' : 'default'}
            >
              {isApplying ? 'Applying...' : hasConflicts ? 'Apply Anyway' : 'Apply Template'}
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isApplying}
                className="w-full h-11"
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
