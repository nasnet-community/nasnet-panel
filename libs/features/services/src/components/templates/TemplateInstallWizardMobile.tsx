/**
 * TemplateInstallWizardMobile Component
 *
 * Mobile/Tablet presenter for template installation wizard.
 * Full-screen modal with bottom navigation and 44px touch targets.
 */

import * as React from 'react';
import { X } from 'lucide-react';

import { Button, Dialog, DialogContent, Progress } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useTemplateInstallWizard } from './useTemplateInstallWizard';
import {
  VariablesStep,
  ReviewStep,
  InstallingStep,
  RoutingStep,
} from './wizard-steps';
import type { TemplateInstallWizardProps } from './TemplateInstallWizard';

/**
 * Mobile presenter for TemplateInstallWizard
 *
 * Features:
 * - Full-screen modal
 * - Step indicator at top (1/4, 2/4, etc.)
 * - Scrollable content area
 * - Bottom navigation bar with 44px touch targets
 * - Cannot dismiss during installation
 */
export function TemplateInstallWizardMobile({
  routerId,
  template,
  open,
  onClose,
  onComplete,
}: TemplateInstallWizardProps) {
  const {
    currentStep,
    context,
    send,
    canGoNext,
    canGoPrev,
    isInstalling,
    isCompleted,
  } = useTemplateInstallWizard({
    routerId,
    template,
    onComplete,
    onCancel: onClose,
  });

  const handleNext = () => {
    if (currentStep === 2) {
      send({ type: 'START_INSTALL' });
    } else if (currentStep === 4) {
      if (context.selectedRoutingRules.length > 0) {
        send({ type: 'APPLY_ROUTING' });
      } else {
        send({ type: 'SKIP_ROUTING' });
      }
      onComplete?.(context.installResult?.instanceIDs || []);
      onClose();
    } else {
      send({ type: 'NEXT' });
    }
  };

  const handleCancel = () => {
    if (!isInstalling) {
      send({ type: 'CANCEL' });
      onClose();
    }
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={isInstalling ? undefined : onClose}>
      <DialogContent
        className="fixed inset-0 z-50 bg-background p-0 flex flex-col"
        hideClose
      >
        {/* Header with step indicator */}
        <div className="border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h2 className="font-semibold">Install Template</h2>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of 4
              </p>
            </div>
            {!isInstalling && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <Progress value={progressPercent} className="h-1 rounded-none" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentStep === 1 && (
            <VariablesStep
              template={template}
              variables={context.variables}
              onVariablesChange={(vars) =>
                send({ type: 'SET_VARIABLES', variables: vars })
              }
            />
          )}
          {currentStep === 2 && (
            <ReviewStep template={template} variables={context.variables} />
          )}
          {currentStep === 3 && (
            <InstallingStep
              progress={context.progress}
              installResult={context.installResult}
            />
          )}
          {currentStep === 4 && (
            <RoutingStep
              template={template}
              selectedRuleIds={context.selectedRoutingRules}
              onToggleRule={(ruleId) =>
                send({ type: 'TOGGLE_ROUTING_RULE', ruleId })
              }
            />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="border-t bg-background p-4">
          <div className="flex gap-3">
            {canGoPrev && (
              <Button
                variant="outline"
                onClick={() => send({ type: 'PREV' })}
                className="flex-1 h-11"
                disabled={isInstalling}
              >
                Previous
              </Button>
            )}
            {!isInstalling && currentStep < 4 && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext && currentStep === 1}
                className={cn('h-11', canGoPrev ? 'flex-1' : 'w-full')}
              >
                {currentStep === 2 ? 'Install' : 'Next'}
              </Button>
            )}
            {currentStep === 4 && !isInstalling && (
              <Button onClick={handleNext} className="flex-1 h-11">
                {context.selectedRoutingRules.length > 0
                  ? 'Apply & Finish'
                  : 'Skip & Finish'}
              </Button>
            )}
            {!canGoPrev && !isInstalling && currentStep < 4 && (
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
