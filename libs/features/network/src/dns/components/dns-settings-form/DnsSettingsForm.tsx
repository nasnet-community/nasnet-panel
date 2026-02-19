/**
 * DNS Settings Form Component
 *
 * Form for configuring DNS settings including:
 * - Remote requests (with security warning)
 * - Cache size
 * - Cache usage display
 *
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { memo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Switch,
  Input,
  Label,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@nasnet/ui/primitives';
import { FieldHelp } from '@nasnet/ui/patterns';
import {
  dnsSettingsSchema,
  type DNSSettingsFormValues,
} from '../../schemas';
import { AlertTriangle } from 'lucide-react';

/**
 * DNS Settings Form Props
 */
export interface DnsSettingsFormProps {
  /** Initial form values */
  initialValues: DNSSettingsFormValues;
  /** Current cache usage in KB */
  cacheUsed: number;
  /** Cache usage percentage (0-100) */
  cacheUsedPercent: number;
  /** Callback when form is submitted */
  onSubmit: (values: DNSSettingsFormValues) => void | Promise<void>;
  /** Whether submit operation is in progress */
  loading?: boolean;
}

/**
 * DNS Settings Form
 *
 * Manages DNS configuration settings with validation and security warnings.
 *
 * Features:
 * - Remote requests toggle with security warning dialog
 * - Cache size configuration with RouterOS limits (512-10240 KB)
 * - Cache usage visualization
 * - Contextual help tooltips
 *
 * @example
 * ```tsx
 * <DnsSettingsForm
 *   initialValues={{
 *     servers: ['1.1.1.1'],
 *     allowRemoteRequests: false,
 *     cacheSize: 2048,
 *   }}
 *   cacheUsed={1024}
 *   cacheUsedPercent={50}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export const DnsSettingsForm = memo(function DnsSettingsForm({
  initialValues,
  cacheUsed,
  cacheUsedPercent,
  onSubmit,
  loading = false,
}: DnsSettingsFormProps) {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [pendingRemoteRequestValue, setPendingRemoteRequestValue] =
    useState(false);

  const form = useForm<DNSSettingsFormValues>({
    resolver: zodResolver(dnsSettingsSchema),
    defaultValues: initialValues,
  });

  /**
   * Handle remote requests toggle
   * Shows security warning when enabling (not when disabling)
   */
  const handleRemoteRequestsChange = (checked: boolean) => {
    // If enabling and was previously disabled, show warning
    if (checked && !form.getValues('allowRemoteRequests')) {
      setPendingRemoteRequestValue(true);
      setShowSecurityWarning(true);
    } else {
      // Disabling - no warning needed
      form.setValue('allowRemoteRequests', checked);
    }
  };

  /**
   * Confirm security warning and enable remote requests
   */
  const handleConfirmSecurityWarning = () => {
    form.setValue('allowRemoteRequests', true);
    setShowSecurityWarning(false);
  };

  /**
   * Cancel security warning and keep remote requests disabled
   */
  const handleCancelSecurityWarning = () => {
    setPendingRemoteRequestValue(false);
    setShowSecurityWarning(false);
  };

  /**
   * Determine cache usage color based on percentage
   */
  const getCacheUsageColor = () => {
    if (cacheUsedPercent >= 90) return 'bg-error';
    if (cacheUsedPercent >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Remote Requests Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="allowRemoteRequests">
              Allow Remote Requests
            </Label>
            <FieldHelp field="remoteRequests" />
          </div>
          <Switch
            id="allowRemoteRequests"
            checked={form.watch('allowRemoteRequests')}
            onCheckedChange={handleRemoteRequestsChange}
            disabled={loading}
            aria-label="Allow remote DNS requests"
          />
        </div>

        {/* Cache Size Configuration */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="cacheSize">Cache Size (KB)</Label>
            <FieldHelp field="cacheSize" />
          </div>
          <Input
            id="cacheSize"
            type="number"
            min={512}
            max={10240}
            step={128}
            disabled={loading}
            {...form.register('cacheSize', { valueAsNumber: true })}
            aria-describedby="cacheSize-error cacheSize-help"
          />
          {form.formState.errors.cacheSize && (
            <p
              id="cacheSize-error"
              className="text-sm text-error"
              role="alert"
            >
              {form.formState.errors.cacheSize.message}
            </p>
          )}
          <p
            id="cacheSize-help"
            className="text-xs text-muted-foreground"
          >
            Valid range: 512 KB to 10240 KB (10 MB)
          </p>
        </div>

        {/* Cache Usage Display */}
        <div className="space-y-2">
          <Label>Cache Usage</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Progress
                value={cacheUsedPercent}
                className={`flex-1 ${getCacheUsageColor()}`}
                aria-label={`Cache usage: ${cacheUsedPercent}%`}
              />
              <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                {cacheUsedPercent}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {cacheUsed} KB / {form.watch('cacheSize')} KB used
            </p>
            {cacheUsedPercent >= 90 && (
              <p className="text-sm text-error flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Cache nearly full - consider increasing cache size
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !form.formState.isDirty}
          className="w-full"
        >
          {loading ? 'Saving...' : 'Save DNS Settings'}
        </Button>
      </form>

      {/* Security Warning Dialog */}
      <Dialog
        open={showSecurityWarning}
        onOpenChange={setShowSecurityWarning}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Security Warning
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                Enabling remote requests allows <strong>ANY device</strong> on{' '}
                <strong>ANY network</strong> to use this router as a DNS
                server.
              </p>
              <p className="text-sm">
                <strong>Recommendation:</strong> Ensure firewall rules block
                external DNS queries (UDP/TCP port 53) from untrusted networks.
              </p>
              <p className="text-sm text-muted-foreground">
                This setting should only be enabled if you understand the
                security implications and have proper firewall protection in
                place.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSecurityWarning}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSecurityWarning}
              className="bg-warning hover:bg-warning/90"
              aria-label="Confirm enabling remote DNS requests"
            >
              I Understand, Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
