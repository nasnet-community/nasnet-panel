/**
 * Configuration Import Wizard Component
 * Multi-step dialog for importing router configuration
 * Follows Direction 6 (Guided Flow) from design spec
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@nasnet/ui/primitives';
import {
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  useEnabledProtocols,
  useCreateBatchJob,
  useBatchJob,
  useCancelBatchJob,
  type ExecutionProtocol,
} from '@nasnet/api-client/queries';
import { ConfigurationInput } from './ConfigurationInput';
import { ProtocolSelector } from './ProtocolSelector';
import { ExecutionProgress } from './ExecutionProgress';

export interface ConfigurationImportWizardProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog closes
   */
  onClose: () => void;

  /**
   * Router IP address
   */
  routerIp: string;

  /**
   * Router credentials for batch job
   */
  credentials: {
    username: string;
    password: string;
  };

  /**
   * Callback when configuration is successfully applied
   */
  onSuccess?: () => void;

  /**
   * Callback when user skips the wizard
   */
  onSkip?: () => void;
}

type WizardStep = 'input' | 'protocol' | 'execute' | 'complete';

/**
 * Step indicator component
 */
function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: { id: WizardStep; label: string }[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              transition-colors duration-200
              ${
                index < currentIndex
                  ? 'bg-success text-white'
                  : index === currentIndex
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }
            `}
          >
            {index < currentIndex ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 transition-colors duration-200 ${
                index < currentIndex
                  ? 'bg-success'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: 'input', label: 'Configuration' },
  { id: 'protocol', label: 'Method' },
  { id: 'execute', label: 'Apply' },
];

/**
 * ConfigurationImportWizard Component
 *
 * Multi-step wizard for importing router configuration.
 * Steps:
 * 1. Input configuration (paste/upload)
 * 2. Select protocol (API/SSH/Telnet)
 * 3. Execute and track progress
 *
 * @example
 * ```tsx
 * <ConfigurationImportWizard
 *   isOpen={showWizard}
 *   onClose={() => setShowWizard(false)}
 *   routerIp="192.168.88.1"
 *   credentials={{ username: 'admin', password: '' }}
 *   onSuccess={() => refetchRouterData()}
 * />
 * ```
 */
export function ConfigurationImportWizard({
  isOpen,
  onClose,
  routerIp,
  credentials,
  onSuccess,
  onSkip,
}: ConfigurationImportWizardProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('input');
  const [configuration, setConfiguration] = useState('');
  const [selectedProtocol, setSelectedProtocol] =
    useState<ExecutionProtocol | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // API hooks
  const { api, ssh, telnet, isLoading: protocolsLoading } =
    useEnabledProtocols(routerIp);
  const createJob = useCreateBatchJob();
  const { data: job, isLoading: jobLoading, error: jobError } = useBatchJob(jobId);
  const cancelJob = useCancelBatchJob();

  // Current step index for indicator
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);

  /**
   * Handles moving to next step
   */
  const handleNext = useCallback(async () => {
    if (step === 'input') {
      // Auto-select first available protocol
      if (api) setSelectedProtocol('api');
      else if (ssh) setSelectedProtocol('ssh');
      else if (telnet) setSelectedProtocol('telnet');
      setStep('protocol');
    } else if (step === 'protocol') {
      if (!selectedProtocol) return;

      try {
        const result = await createJob.mutateAsync({
          routerIp,
          username: credentials.username,
          password: credentials.password,
          protocol: selectedProtocol,
          script: configuration,
          rollbackEnabled: true,
        });
        setJobId(result.jobId);
        setStep('execute');
      } catch (error) {
        console.error('Failed to create batch job:', error);
      }
    }
  }, [
    step,
    api,
    ssh,
    telnet,
    selectedProtocol,
    createJob,
    routerIp,
    credentials,
    configuration,
  ]);

  /**
   * Handles moving to previous step
   */
  const handleBack = useCallback(() => {
    if (step === 'protocol') {
      setStep('input');
    }
  }, [step]);

  /**
   * Handles skip action
   */
  const handleSkip = useCallback(() => {
    onSkip?.();
    onClose();
  }, [onSkip, onClose]);

  /**
   * Handles job completion
   */
  const handleComplete = useCallback(() => {
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);

  /**
   * Handles job cancellation
   */
  const handleCancel = useCallback(async () => {
    if (jobId) {
      try {
        await cancelJob.mutateAsync(jobId);
      } catch (error) {
        console.error('Failed to cancel job:', error);
      }
    }
  }, [jobId, cancelJob]);

  /**
   * Handles retry after failure
   */
  const handleRetry = useCallback(() => {
    setJobId(null);
    setStep('protocol');
  }, []);

  /**
   * Reset wizard state when closing
   */
  const handleClose = useCallback(() => {
    // Only allow closing if not executing
    if (step !== 'execute' || job?.status !== 'running') {
      setStep('input');
      setConfiguration('');
      setSelectedProtocol(null);
      setJobId(null);
      onClose();
    }
  }, [step, job?.status, onClose]);

  // Check if next button should be enabled
  const canProceed =
    step === 'input'
      ? configuration.trim().length > 0
      : step === 'protocol'
      ? selectedProtocol !== null
      : false;

  // Is job finished?
  const isJobComplete = job?.status === 'completed';
  const isJobFailed =
    job?.status === 'failed' ||
    job?.status === 'rolled_back' ||
    job?.status === 'cancelled';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <DialogTitle>Router Configuration</DialogTitle>
              <DialogDescription>
                {step === 'input' && 'Import your router configuration'}
                {step === 'protocol' && 'Choose connection method'}
                {step === 'execute' &&
                  (isJobComplete
                    ? 'Configuration applied!'
                    : isJobFailed
                    ? 'Something went wrong'
                    : 'Applying configuration...')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Step Indicator */}
        {step !== 'execute' && (
          <StepIndicator steps={WIZARD_STEPS} currentIndex={currentStepIndex} />
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ConfigurationInput
                value={configuration}
                onChange={setConfiguration}
              />
            </motion.div>
          )}

          {step === 'protocol' && (
            <motion.div
              key="protocol"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ProtocolSelector
                value={selectedProtocol}
                onChange={setSelectedProtocol}
                apiEnabled={api}
                sshEnabled={ssh}
                telnetEnabled={telnet}
                isLoading={protocolsLoading}
              />
            </motion.div>
          )}

          {step === 'execute' && (
            <motion.div
              key="execute"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ExecutionProgress
                job={job ?? null}
                isLoading={jobLoading}
                error={jobError}
                onCancel={handleCancel}
                onRetry={handleRetry}
                isCancelling={cancelJob.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          {/* Left side */}
          <div>
            {step === 'input' && (
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Skip for now
              </button>
            )}
            {step === 'protocol' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex gap-3">
            {step !== 'execute' && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}

            {step === 'input' && (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="btn-action px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 'protocol' && (
              <button
                onClick={handleNext}
                disabled={!canProceed || createJob.isPending}
                className="btn-action px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createJob.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Starting...
                  </>
                ) : (
                  <>
                    Apply Configuration
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {step === 'execute' && isJobComplete && (
              <button
                onClick={handleComplete}
                className="btn-action px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Done
              </button>
            )}

            {step === 'execute' && isJobFailed && (
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

