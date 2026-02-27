/**
 * InstallDialog Component
 *
 * Multi-step dialog for installing new service instances.
 * Step 1: Select service from marketplace
 * Step 2: Configure instance (name, VLAN, bind IP, ports)
 * Step 3: Installing with real-time progress
 * Step 4: Complete with success message
 *
 * Features:
 * - Marketplace service selection with descriptions
 * - Real-time installation progress via subscription
 * - Configuration validation
 * - Auto-rollback on errors
 * - Accessibility: keyboard navigation, ARIA labels, role attributes
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Install Service</Button>
 *     <InstallDialog
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       routerId={routerId}
 *       onSuccess={() => refetchServices()}
 *     />
 *   </>
 * );
 * ```
 *
 * @see docs/design/ux-design/6-component-library.md#multi-step-wizard
 */

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useAvailableServices,
  useInstallService,
  useInstallProgressSubscription,
} from '@nasnet/api-client/queries';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Icon,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

/**
 * Installation step type
 */
type InstallStep = 'select' | 'configure' | 'installing' | 'complete';

/**
 * InstallDialog props
 */
export interface InstallDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Router ID for installation context */
  routerId: string;
  /** Optional success callback after installation completes */
  onSuccess?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * InstallDialog component - Multi-step wizard for service installation
 */
function InstallDialogComponent({
  open,
  onClose,
  routerId,
  onSuccess,
  className,
}: InstallDialogProps) {
  const { t } = useTranslation(['services', 'common']);

  // Fetch available services
  const { services, loading: servicesLoading } = useAvailableServices();

  // Install mutation
  const [installService, { loading: installing }] = useInstallService();

  // Subscribe to install progress
  const { progress } = useInstallProgressSubscription(routerId);

  // Current step
  const [step, setStep] = useState<InstallStep>('select');

  // Selected service
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  // Configuration
  const [instanceName, setInstanceName] = useState('');
  const [vlanId, setVlanId] = useState('');
  const [bindIp, setBindIp] = useState('');
  const [ports, setPorts] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset on close after animation
      const timer = setTimeout(() => {
        setStep('select');
        setSelectedServiceId('');
        setInstanceName('');
        setVlanId('');
        setBindIp('');
        setPorts('');
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
    return;
  }, [open]);

  // Update progress based on subscription
  useEffect(() => {
    if (progress && step === 'installing') {
      if (progress.status === 'completed') {
        setStep('complete');
      } else if (progress.status === 'failed') {
        setError(
          progress.errorMessage || t('services:wizard.installationFailed', 'Installation failed')
        );
      }
    }
  }, [progress, step, t]);

  // Get selected service - memoized
  const selectedService = useMemo(
    () => services?.find((s: any) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  // Auto-populate instance name when service is selected
  useEffect(() => {
    if (selectedService && !instanceName) {
      setInstanceName(`${selectedService.name} Instance 1`);
    }
  }, [selectedService, instanceName]);

  // Handle next step
  const handleNext = useCallback(async () => {
    if (step === 'select') {
      if (!selectedServiceId) {
        setError(t('services:wizard.selectServiceError', 'Please select a service'));
        return;
      }
      setStep('configure');
      setError(null);
    } else if (step === 'configure') {
      if (!instanceName.trim()) {
        setError(t('services:wizard.instanceNameError', 'Please enter an instance name'));
        return;
      }

      // Start installation
      setStep('installing');
      setError(null);

      try {
        const result = await installService({
          variables: {
            input: {
              routerID: routerId,
              featureID: selectedServiceId,
              instanceName: instanceName.trim(),
              vlanID: vlanId ? parseInt(vlanId, 10) : undefined,
              bindIP: bindIp || undefined,
              ports: ports ? ports.split(',').map((p) => parseInt(p.trim(), 10)) : undefined,
              config: {},
            },
          },
        });

        if (result.data?.installService?.errors?.length) {
          setError(result.data.installService.errors[0].message);
          setStep('configure');
        }
      } catch (err) {
        setError(
          err instanceof Error ?
            err.message
          : t('services:wizard.installationFailed', 'Installation failed')
        );
        setStep('configure');
      }
    } else if (step === 'complete') {
      onSuccess?.();
      onClose();
    }
  }, [
    step,
    selectedServiceId,
    instanceName,
    vlanId,
    bindIp,
    ports,
    routerId,
    installService,
    onSuccess,
    onClose,
    t,
  ]);

  // Handle back
  const handleBack = useCallback(() => {
    if (step === 'configure') {
      setStep('select');
      setError(null);
    }
  }, [step]);

  // Handle close
  const handleClose = useCallback(() => {
    if (step !== 'installing') {
      onClose();
    }
  }, [step, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className={cn('sm:max-w-[600px]', className)}>
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && t('services:wizard.selectService', 'Select Service')}
            {step === 'configure' && t('services:wizard.configureInstance', 'Configure Instance')}
            {step === 'installing' && t('services:wizard.installing', 'Installing Service')}
            {step === 'complete' &&
              t('services:wizard.installationComplete', 'Installation Complete')}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' &&
              t(
                'services:wizard.selectServiceDesc',
                'Choose a service from the Feature Marketplace'
              )}
            {step === 'configure' &&
              t('services:wizard.configureDesc', 'Configure your service instance')}
            {step === 'installing' &&
              t('services:wizard.installingDesc', 'Please wait while the service is installed')}
            {step === 'complete' &&
              t('services:wizard.completeDesc', 'Your service has been installed successfully')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-component-md">
          {/* Step 1: Select service */}
          {step === 'select' && (
            <div
              className="space-y-component-md"
              role="group"
              aria-label={t('services:wizard.selectServiceGroup', 'Select a service')}
            >
              {servicesLoading ?
                <div className="space-y-component-md">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full"
                    />
                  ))}
                </div>
              : <div className="space-y-component-sm">
                  {services?.map((service: any) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      aria-label={t('common:selectOption', `Select ${service.name}`)}
                      aria-pressed={selectedServiceId === service.id}
                      className={cn(
                        'p-component-md min-h-[44px] w-full rounded-lg border-2 text-left transition-all',
                        'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        selectedServiceId === service.id ?
                          'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="gap-component-md flex items-center">
                        {service.icon && <div className="h-10 w-10 shrink-0">{service.icon}</div>}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-muted-foreground truncate text-sm">
                            {service.description}
                          </p>
                        </div>
                        <div className="text-muted-foreground font-mono text-xs">
                          v{service.version}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedService && (
            <div
              className="space-y-component-md"
              role="group"
              aria-label={t('services:wizard.configureGroup', 'Configure instance')}
            >
              {/* Instance name */}
              <div className="space-y-component-sm">
                <Label htmlFor="instance-name">
                  {t('services:wizard.instanceName', 'Instance Name')}{' '}
                  <span aria-label="required">*</span>
                </Label>
                <Input
                  id="instance-name"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder={t('services:wizard.instanceNamePlaceholder', 'My Service Instance')}
                  aria-describedby="instance-name-error"
                  required
                />
              </div>

              {/* VLAN ID (optional) */}
              <div className="space-y-component-sm">
                <Label htmlFor="vlan-id">
                  {t('services:wizard.vlanId', 'VLAN ID')} ({t('common.optional', 'optional')})
                </Label>
                <Input
                  id="vlan-id"
                  type="number"
                  min="1"
                  max="4094"
                  value={vlanId}
                  onChange={(e) => setVlanId(e.target.value)}
                  placeholder="100"
                  aria-describedby="vlan-id-help"
                />
                <p
                  id="vlan-id-help"
                  className="text-muted-foreground text-xs"
                >
                  {t('services:wizard.vlanIdHelp', 'Isolate this service in a VLAN')}
                </p>
              </div>

              {/* Bind IP (optional) */}
              <div className="space-y-component-sm">
                <Label htmlFor="bind-ip">
                  {t('services:wizard.bindIp', 'Bind IP')} ({t('common.optional', 'optional')})
                </Label>
                <Input
                  id="bind-ip"
                  value={bindIp}
                  onChange={(e) => setBindIp(e.target.value)}
                  placeholder="192.168.1.100"
                  aria-describedby="bind-ip-help"
                  className="font-mono"
                />
                <p
                  id="bind-ip-help"
                  className="text-muted-foreground text-xs"
                >
                  {t('services:wizard.bindIpHelp', 'Specific IP address to bind the service to')}
                </p>
              </div>

              {/* Ports (optional) */}
              <div className="space-y-component-sm">
                <Label htmlFor="ports">
                  {t('services:wizard.ports', 'Ports')} ({t('common.optional', 'optional')})
                </Label>
                <Input
                  id="ports"
                  value={ports}
                  onChange={(e) => setPorts(e.target.value)}
                  placeholder="9050, 9051"
                  aria-describedby="ports-help"
                  className="font-mono"
                />
                <p
                  id="ports-help"
                  className="text-muted-foreground text-xs"
                >
                  {t(
                    'services:wizard.portsHelp',
                    'Comma-separated list of ports (default ports will be used if not specified)'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Installing */}
          {step === 'installing' && (
            <div
              className="space-y-component-md"
              role="status"
              aria-label={t('services:wizard.installingStatus', 'Installation in progress')}
            >
              <div className="space-y-component-sm">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('services:wizard.downloadingBinary', 'Downloading binary...')}</span>
                  <span className="text-muted-foreground font-mono">{progress?.percent || 0}%</span>
                </div>
                <Progress
                  value={progress?.percent || 0}
                  aria-valuenow={progress?.percent || 0}
                />
              </div>

              {progress?.bytesDownloaded && progress?.totalBytes && (
                <p className="text-muted-foreground text-center font-mono text-xs">
                  {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div
              className="py-component-lg text-center"
              role="status"
              aria-label={t('services:wizard.installationCompleteStatus', 'Installation complete')}
            >
              <div className="bg-success/10 mb-component-md mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Icon
                  icon={CheckCircle}
                  className="text-success h-8 w-8"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mb-component-sm text-lg font-semibold">
                {t(
                  'services:wizard.serviceInstalledSuccessfully',
                  'Service Installed Successfully'
                )}
              </h3>
              <p className="text-muted-foreground font-mono text-sm">
                {t('services:wizard.readyToUse', '{{name}} is now ready to use', {
                  name: instanceName,
                })}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="p-component-sm bg-error/10 border-error rounded-md border"
              role="alert"
              aria-live="polite"
              id="install-error"
            >
              <p className="text-error text-sm font-semibold">{t('common.error', 'Error')}</p>
              <p className="text-error mt-component-xs text-sm">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'configure' && (
            <Button
              variant="outline"
              onClick={handleBack}
            >
              {t('common.back', 'Back')}
            </Button>
          )}

          {step !== 'installing' && step !== 'complete' && (
            <Button
              variant="ghost"
              onClick={handleClose}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}

          {step !== 'installing' && (
            <Button
              onClick={handleNext}
              disabled={installing}
              aria-busy={installing}
            >
              {step === 'complete' ? t('common.done', 'Done') : t('common.next', 'Next')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const InstallDialog = React.memo(InstallDialogComponent);
InstallDialog.displayName = 'InstallDialog';

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
