/**
 * InstallDialog Component
 *
 * Multi-step dialog for installing new service instances.
 * Shows available services, configuration options, and installation progress.
 *
 * @see Task #10: Domain Components & Pages
 */

import * as React from 'react';
import { useState, useEffect } from 'react';

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
} from '@nasnet/ui/primitives';

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
  /** Close handler */
  onClose: () => void;
  /** Router ID */
  routerId: string;
  /** Success callback */
  onSuccess?: () => void;
}

/**
 * InstallDialog component
 *
 * Features:
 * - Step 1: Select service from marketplace
 * - Step 2: Configure instance (name, VLAN, bind IP, ports)
 * - Step 3: Installing with real-time progress
 * - Step 4: Complete with success message
 */
export function InstallDialog({
  open,
  onClose,
  routerId,
  onSuccess,
}: InstallDialogProps) {
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
      // Reset on close
      setTimeout(() => {
        setStep('select');
        setSelectedServiceId('');
        setInstanceName('');
        setVlanId('');
        setBindIp('');
        setPorts('');
        setError(null);
      }, 300); // Wait for dialog close animation
    }
  }, [open]);

  // Update progress based on subscription
  useEffect(() => {
    if (progress && step === 'installing') {
      if (progress.status === 'completed') {
        setStep('complete');
      } else if (progress.status === 'failed') {
        setError(progress.errorMessage || 'Installation failed');
      }
    }
  }, [progress, step]);

  // Get selected service
  const selectedService = services?.find((s: any) => s.id === selectedServiceId);

  // Auto-populate instance name when service is selected
  useEffect(() => {
    if (selectedService && !instanceName) {
      setInstanceName(`${selectedService.name} Instance 1`);
    }
  }, [selectedService, instanceName]);

  // Handle next step
  const handleNext = async () => {
    if (step === 'select') {
      if (!selectedServiceId) {
        setError('Please select a service');
        return;
      }
      setStep('configure');
      setError(null);
    } else if (step === 'configure') {
      if (!instanceName.trim()) {
        setError('Please enter an instance name');
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
              ports: ports
                ? ports.split(',').map((p) => parseInt(p.trim(), 10))
                : undefined,
              config: {}, // TODO: Add advanced config
            },
          },
        });

        if (result.data?.installService?.errors?.length) {
          setError(result.data.installService.errors[0].message);
          setStep('configure');
        }
        // Success handling happens via subscription
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Installation failed');
        setStep('configure');
      }
    } else if (step === 'complete') {
      onSuccess?.();
      onClose();
    }
  };

  // Handle back
  const handleBack = () => {
    if (step === 'configure') {
      setStep('select');
      setError(null);
    }
  };

  // Handle close
  const handleClose = () => {
    if (step !== 'installing') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Select Service'}
            {step === 'configure' && 'Configure Instance'}
            {step === 'installing' && 'Installing Service'}
            {step === 'complete' && 'Installation Complete'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' &&
              'Choose a service from the Feature Marketplace'}
            {step === 'configure' && 'Configure your service instance'}
            {step === 'installing' && 'Please wait while the service is installed'}
            {step === 'complete' && 'Your service has been installed successfully'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Select service */}
          {step === 'select' && (
            <div className="space-y-4">
              {servicesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {services?.map((service: any) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`
                        w-full p-4 text-left rounded-lg border-2 transition-all
                        ${
                          selectedServiceId === service.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {service.icon && (
                          <div className="w-10 h-10 shrink-0">
                            {service.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {service.description}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          v{service.version}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedService && (
            <div className="space-y-4">
              {/* Instance name */}
              <div className="space-y-2">
                <Label htmlFor="instance-name">Instance Name *</Label>
                <Input
                  id="instance-name"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="My Service Instance"
                />
              </div>

              {/* VLAN ID (optional) */}
              <div className="space-y-2">
                <Label htmlFor="vlan-id">VLAN ID (optional)</Label>
                <Input
                  id="vlan-id"
                  type="number"
                  min="1"
                  max="4094"
                  value={vlanId}
                  onChange={(e) => setVlanId(e.target.value)}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Isolate this service in a VLAN
                </p>
              </div>

              {/* Bind IP (optional) */}
              <div className="space-y-2">
                <Label htmlFor="bind-ip">Bind IP (optional)</Label>
                <Input
                  id="bind-ip"
                  value={bindIp}
                  onChange={(e) => setBindIp(e.target.value)}
                  placeholder="192.168.1.100"
                />
                <p className="text-xs text-muted-foreground">
                  Specific IP address to bind the service to
                </p>
              </div>

              {/* Ports (optional) */}
              <div className="space-y-2">
                <Label htmlFor="ports">Ports (optional)</Label>
                <Input
                  id="ports"
                  value={ports}
                  onChange={(e) => setPorts(e.target.value)}
                  placeholder="9050, 9051"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of ports (default ports will be used if not specified)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Installing */}
          {step === 'installing' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Downloading binary...</span>
                  <span className="text-muted-foreground">
                    {progress?.percent || 0}%
                  </span>
                </div>
                <Progress value={progress?.percent || 0} />
              </div>

              {progress?.bytesDownloaded && progress?.totalBytes && (
                <p className="text-xs text-muted-foreground text-center">
                  {formatBytes(progress.bytesDownloaded)} /{' '}
                  {formatBytes(progress.totalBytes)}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-600 dark:text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Service Installed Successfully
              </h3>
              <p className="text-sm text-muted-foreground">
                {instanceName} is now ready to use
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'configure' && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}

          {step !== 'installing' && step !== 'complete' && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step !== 'installing' && (
            <Button onClick={handleNext} disabled={installing}>
              {step === 'complete' ? 'Done' : 'Next'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
