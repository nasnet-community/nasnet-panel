/**
 * TemplateInstallWizardDesktop Component
 *
 * @description Desktop presenter for template installation wizard.
 * Centered modal with horizontal stepper and side navigation.
 *
 * Features:
 * - Centered modal (max-w-3xl)
 * - Horizontal stepper at top
 * - Scrollable content area
 * - Footer with navigation buttons
 * - Keyboard shortcuts (Esc to cancel, Enter for next)
 */

import * as React from 'react';
import { memo, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { useTemplateInstallWizard } from './useTemplateInstallWizard';
import {
  VariablesStep,
  ReviewStep,
  InstallingStep,
  RoutingStep,
} from './wizard-steps';
import type { TemplateInstallWizardProps } from './TemplateInstallWizard';

const STEPS = [
  { number: 1, label: 'Variables' },
  { number: 2, label: 'Review' },
  { number: 3, label: 'Installing' },
  { number: 4, label: 'Routing' },
];

/**
 * Desktop presenter for TemplateInstallWizard
 */
function TemplateInstallWizardDesktopComponent({
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

  const handleNext = useCallback(() => {
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
  }, [currentStep, context.selectedRoutingRules.length, context.installResult?.instanceIDs, send, onComplete, onClose]);

  const handleCancel = useCallback(() => {
    if (!isInstalling) {
      send({ type: 'CANCEL' });
      onClose();
    }
  }, [isInstalling, send, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isInstalling) {
        handleCancel();
      } else if (e.key === 'Enter' && canGoNext && currentStep === 1) {
        handleNext();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => { window.removeEventListener('keydown', handleKeyDown); };
    }
    return undefined;
  }, [open, isInstalling, canGoNext, currentStep, handleCancel, handleNext]);

  return (
    <Dialog open={open} onOpenChange={isInstalling ? undefined : onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-component-lg pt-component-lg pb-component-sm">
          <DialogTitle>Install Template: {template.name}</DialogTitle>

          {/* Horizontal Stepper */}
          <div className="flex items-center justify-between mt-component-lg">
            {STEPS.map((step, index) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-component-md">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive &&
                          'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                        isCompleted && 'bg-primary text-primary-foreground',
                        !isActive &&
                          !isCompleted &&
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isActive && 'text-foreground',
                        !isActive && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-component-md',
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-component-lg py-component-md">
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

        {/* Footer */}
        <div className="border-border px-6 py-4 bg-card border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isInstalling
                ? 'Installation in progress...'
                : `Step ${currentStep} of 4`}
            </div>
            <div className="flex gap-component-md">
              {canGoPrev && (
                <Button
                  variant="outline"
                  onClick={() => send({ type: 'PREV' })}
                  disabled={isInstalling}
                >
                  Previous
                </Button>
              )}
              {!isInstalling && currentStep < 4 && (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext && currentStep === 1}
                >
                  {currentStep === 2 ? 'Install' : 'Next'}
                </Button>
              )}
              {currentStep === 4 && !isInstalling && (
                <Button onClick={handleNext}>
                  {context.selectedRoutingRules.length > 0
                    ? 'Apply & Finish'
                    : 'Skip & Finish'}
                </Button>
              )}
              {!canGoPrev && !isInstalling && currentStep < 4 && (
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Wrap with memo for performance
export const TemplateInstallWizardDesktop = memo(TemplateInstallWizardDesktopComponent);

// Set display name for React DevTools
TemplateInstallWizardDesktop.displayName = 'TemplateInstallWizardDesktop';
