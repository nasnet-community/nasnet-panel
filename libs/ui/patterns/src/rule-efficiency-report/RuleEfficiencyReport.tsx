/**
 * RuleEfficiencyReport - Pattern component for firewall rule optimization
 * Layer 2 pattern component following ADR-017
 *
 * Features:
 * - Detects redundant firewall rules
 * - Suggests performance-improving reordering
 * - Provides actionable recommendations
 * - WCAG AAA accessible
 */

import React, { useMemo, useState, memo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  cn,
} from '@nasnet/ui/primitives';

import { detectRedundantRules } from './detect-redundancy';
import { suggestReorder } from './suggest-reorder';

import type { RuleEfficiencyReportProps, Suggestion, SuggestionSeverity } from './types';

/**
 * Get badge variant based on severity
 */
function getSeverityVariant(severity: SuggestionSeverity): 'error' | 'default' | 'secondary' {
  switch (severity) {
    case 'high':
      return 'error';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
  }
}

/**
 * Get severity label with proper casing
 */
function getSeverityLabel(severity: SuggestionSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * SuggestionCard component for displaying individual suggestions
 */
interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: (suggestion: Suggestion) => void;
  onPreview: (suggestion: Suggestion) => void;
}

const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onApply,
  onPreview,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleApplyClick = () => {
    if (suggestion.severity === 'high' || suggestion.action === 'delete') {
      setShowConfirmDialog(true);
    } else {
      onApply(suggestion);
    }
  };

  const handleConfirmApply = () => {
    setShowConfirmDialog(false);
    onApply(suggestion);
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={getSeverityVariant(suggestion.severity)}>
                  {getSeverityLabel(suggestion.severity)}
                </Badge>
                <Badge variant="outline">{suggestion.action}</Badge>
              </div>
              <CardTitle className="text-base">{suggestion.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="text-sm">{suggestion.description}</CardDescription>

          {suggestion.estimatedImpact && (
            <Alert>
              <AlertTitle>Estimated Impact</AlertTitle>
              <AlertDescription>{suggestion.estimatedImpact}</AlertDescription>
            </Alert>
          )}

          {/* Affected Rules */}
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary focus:ring-primary rounded text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-expanded={isExpanded}
              aria-controls={`affected-rules-${suggestion.id}`}
            >
              {isExpanded ? 'Hide' : 'Show'} affected rules ({suggestion.affectedRules.length})
            </button>

            {isExpanded && (
              <div
                id={`affected-rules-${suggestion.id}`}
                className="bg-muted mt-2 rounded-md p-3"
              >
                <ul className="space-y-1 text-sm">
                  {suggestion.affectedRules.map((ruleId) => (
                    <li
                      key={ruleId}
                      className="font-mono"
                    >
                      Rule ID: {ruleId}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(suggestion)}
              aria-label={`Preview ${suggestion.title}`}
            >
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleApplyClick}
              aria-label={`Apply ${suggestion.title}`}
            >
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {suggestion.action === 'delete' ?
                'This will permanently delete the redundant rule. This action cannot be undone.'
              : 'This is a high-severity change. Please review carefully before applying.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 text-sm font-medium">Suggestion:</p>
            <p className="text-muted-foreground text-sm">{suggestion.description}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={suggestion.action === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmApply}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

/**
 * EmptyState component for when no suggestions are found
 */
const EmptyState = memo(function EmptyState({ type }: { type: 'redundancy' | 'reorder' }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-3">
          <svg
            className="text-muted-foreground h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">
          No {type === 'redundancy' ? 'Redundancy' : 'Reordering'} Issues Found
        </h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          {type === 'redundancy' ?
            'Your firewall rules appear to be optimized with no redundant rules detected.'
          : 'Your firewall rules are already ordered efficiently for performance.'}
        </p>
      </CardContent>
    </Card>
  );
});

/**
 * RuleEfficiencyReport component
 *
 * Analyzes firewall rules to detect redundancies and suggest performance
 * improvements through reordering.
 */
function RuleEfficiencyReportComponent({
  rules,
  onApplySuggestion,
  onPreview,
  className,
}: RuleEfficiencyReportProps) {
  const redundancySuggestions = useMemo(() => detectRedundantRules(rules), [rules]);
  const reorderSuggestions = useMemo(() => suggestReorder(rules), [rules]);

  const totalSuggestions = redundancySuggestions.length + reorderSuggestions.length;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Rule Efficiency Report</CardTitle>
        <CardDescription>
          Optimize your firewall rules by addressing redundancies and performance issues
        </CardDescription>
        {totalSuggestions > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">
              {totalSuggestions} {totalSuggestions === 1 ? 'suggestion' : 'suggestions'}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="redundancy"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="redundancy">
              Redundancy {redundancySuggestions.length > 0 && `(${redundancySuggestions.length})`}
            </TabsTrigger>
            <TabsTrigger value="reorder">
              Reordering {reorderSuggestions.length > 0 && `(${reorderSuggestions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="redundancy"
            className="mt-4"
          >
            <ScrollArea className="h-[500px] pr-4">
              {redundancySuggestions.length === 0 ?
                <EmptyState type="redundancy" />
              : <div>
                  {redundancySuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={onApplySuggestion}
                      onPreview={onPreview}
                    />
                  ))}
                </div>
              }
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="reorder"
            className="mt-4"
          >
            <ScrollArea className="h-[500px] pr-4">
              {reorderSuggestions.length === 0 ?
                <EmptyState type="reorder" />
              : <div>
                  {reorderSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onApply={onApplySuggestion}
                      onPreview={onPreview}
                    />
                  ))}
                </div>
              }
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export const RuleEfficiencyReport = memo(RuleEfficiencyReportComponent);
RuleEfficiencyReport.displayName = 'RuleEfficiencyReport';
