/**
 * RoutingStep Component
 *
 * Fourth step of template installation wizard.
 * Optional routing rule suggestions that can be applied after installation.
 */

import React, { useCallback, useMemo } from 'react';
import { Route, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

/**
 * Props for RoutingStep
 */
export interface RoutingStepProps {
  /** Template with routing suggestions */
  template: ServiceTemplate;
  /** Currently selected routing rule IDs */
  selectedRuleIds: string[];
  /** Callback when rule selection changes */
  onToggleRule: (ruleId: string) => void;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * RoutingStep - Optional routing rule suggestions
 *
 * Features:
 * - Display suggested routing rules from template
 * - Checkbox selection for each rule
 * - Preview of what will be applied
 * - Skip or apply selected rules
 *
 * @example
 * ```tsx
 * <RoutingStep
 *   template={template}
 *   selectedRuleIds={selected}
 *   onToggleRule={handleToggle}
 * />
 * ```
 */
export const RoutingStep = React.memo(function RoutingStep({
  template,
  selectedRuleIds,
  onToggleRule,
  className,
}: RoutingStepProps) {
  const hasSuggestions = useMemo(
    () => template.suggestedRouting && template.suggestedRouting.length > 0,
    [template.suggestedRouting]
  );

  const description = useMemo(() => {
    return hasSuggestions
      ? 'Select routing rules to apply for your newly installed services'
      : 'This template has no routing suggestions';
  }, [hasSuggestions]);

  const handleToggle = useCallback(
    (ruleId: string) => {
      onToggleRule(ruleId);
    },
    [onToggleRule]
  );

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h2 className="text-lg font-semibold">Configure Routing (Optional)</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {hasSuggestions ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon
                  icon={Route}
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Suggested Routing Rules ({template.suggestedRouting?.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.suggestedRouting?.map((rule, index) => {
                const ruleId = `rule-${index}`;
                const isSelected = selectedRuleIds.includes(ruleId);

                return (
                  <div
                    key={ruleId}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={ruleId}
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(ruleId)}
                      className="mt-1"
                      aria-label={`Select routing rule: ${rule.description}`}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={ruleId}
                        className="cursor-pointer font-medium"
                      >
                        {rule.description}
                      </Label>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>
                          <span className="font-medium">Devices:</span>{' '}
                          <span className="font-mono">{rule.devicePattern}</span>
                        </p>
                        <p>
                          <span className="font-medium">Target:</span>{' '}
                          <span className="font-mono">{rule.targetService}</span>
                        </p>
                        {rule.protocol && (
                          <p>
                            <span className="font-medium">Protocol:</span>{' '}
                            <span className="font-mono">{rule.protocol}</span>
                          </p>
                        )}
                        {rule.destinationPort && (
                          <p>
                            <span className="font-medium">Port:</span>{' '}
                            <span className="font-mono">
                              {rule.destinationPort}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Icon
                        icon={CheckCircle2}
                        className="h-5 w-5 text-primary shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {selectedRuleIds.length > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    icon={CheckCircle2}
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  <span className="font-medium">
                    {selectedRuleIds.length} routing rule
                    {selectedRuleIds.length !== 1 ? 's' : ''} will be applied
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon
              icon={Route}
              className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">
              This template doesn't include routing suggestions
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You can configure routing manually later
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

RoutingStep.displayName = 'RoutingStep';
