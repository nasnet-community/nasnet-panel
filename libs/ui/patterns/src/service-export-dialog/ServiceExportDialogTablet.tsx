/**
 * ServiceExportDialogTablet - Tablet presenter for service export dialog
 * Hybrid approach: Dialog primitive with mobile-friendly spacing and touch targets
 */

import { Download, Copy, CheckCircle2, Share2, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Alert,
  AlertDescription,
  Badge,
} from '@nasnet/ui/primitives';

import { useServiceExportDialog } from './useServiceExportDialog';

import type { ServiceExportDialogProps } from './types';

export function ServiceExportDialogTablet(props: ServiceExportDialogProps) {
  const { open, onOpenChange, trigger } = props;
  const {
    state,
    loading,
    instance,
    setFormat,
    setOptions,
    handleExport,
    handleDownload,
    handleCopy,
    reset,
  } = useServiceExportDialog(props);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="default"
            className="min-h-[44px]"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-xl rounded-[var(--semantic-radius-modal)] border p-6 shadow-[var(--semantic-shadow-modal)]">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg font-semibold">
            Export Service Configuration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Export {instance.instanceName} ({instance.featureID})
          </DialogDescription>
        </DialogHeader>

        {state.step === 'configure' && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base">Export Format</Label>
              <RadioGroup
                value={state.options.format}
                onValueChange={setFormat}
              >
                <div className="space-y-component-md">
                  {/* JSON Format */}
                  <div
                    className={`p-component-md flex min-h-[44px] cursor-pointer items-start space-x-3 rounded-[var(--semantic-radius-input)] border transition-colors ${
                      state.options.format === 'json' ?
                        'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormat('json')}
                  >
                    <RadioGroupItem
                      value="json"
                      id="format-json-tablet"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="format-json-tablet"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">JSON File</span>
                          <Badge variant="secondary">.json</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Downloadable JSON file for manual import or sharing
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* QR Code Format */}
                  <div
                    className={`p-component-md flex min-h-[44px] cursor-pointer items-start space-x-3 rounded-[var(--semantic-radius-input)] border transition-colors ${
                      state.options.format === 'qr' ?
                        'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormat('qr')}
                  >
                    <RadioGroupItem
                      value="qr"
                      id="format-qr-tablet"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="format-qr-tablet"
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">QR Code</span>
                          <Badge variant="secondary">.png</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Scannable QR code for quick mobile import (2KB limit)
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Export Options */}
            <div className="border-border p-component-md bg-muted/30 space-y-4 rounded-[var(--semantic-radius-input)] border">
              <div className="flex min-h-[44px] items-center justify-between">
                <div className="flex-1 space-y-0.5">
                  <Label
                    htmlFor="redact-secrets-tablet"
                    className="text-base"
                  >
                    Redact Secrets
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Hide passwords, API keys, and sensitive data
                  </p>
                </div>
                <Switch
                  id="redact-secrets-tablet"
                  checked={state.options.redactSecrets}
                  onCheckedChange={(checked: boolean) => setOptions({ redactSecrets: checked })}
                />
              </div>

              <div className="flex min-h-[44px] items-center justify-between">
                <div className="flex-1 space-y-0.5">
                  <Label
                    htmlFor="include-routing-tablet"
                    className="text-base"
                  >
                    Include Routing Rules
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Export device-to-service routing assignments
                  </p>
                </div>
                <Switch
                  id="include-routing-tablet"
                  checked={state.options.includeRoutingRules}
                  onCheckedChange={(checked: boolean) =>
                    setOptions({ includeRoutingRules: checked })
                  }
                />
              </div>
            </div>

            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="gap-component-md flex flex-col">
              <Button
                onClick={handleExport}
                disabled={loading}
                size="default"
                className="min-h-[44px] w-full"
              >
                {loading ? 'Exporting...' : `Export as ${state.options.format.toUpperCase()}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                size="default"
                className="min-h-[44px] w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {state.step === 'exporting' && (
          <div className="py-12 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Share2 className="text-primary h-8 w-8 animate-pulse" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Preparing export...</h3>
            <p className="text-muted-foreground text-sm">
              Generating {state.options.format.toUpperCase()} export package
            </p>
          </div>
        )}

        {state.step === 'complete' && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="py-4 text-center">
              <div className="bg-success/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <CheckCircle2 className="text-success h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Export Complete!</h3>
              <p className="text-muted-foreground text-sm">
                {instance.instanceName} exported as {state.options.format.toUpperCase()}
              </p>
            </div>

            {/* QR Code Preview */}
            {state.options.format === 'qr' && state.qrImageData && (
              <div className="flex justify-center">
                <div className="border-border p-component-md bg-card rounded-[var(--semantic-radius-input)] border">
                  <img
                    src={`data:image/png;base64,${state.qrImageData}`}
                    alt="Service Configuration QR Code"
                    className="h-64 w-64"
                  />
                </div>
              </div>
            )}

            {/* JSON Preview */}
            {state.options.format === 'json' && (
              <Alert>
                <AlertDescription>
                  <p className="mb-1 font-medium">JSON file ready for download</p>
                  <p className="text-sm">
                    The exported configuration can be imported into any NasNetConnect instance
                    {state.options.redactSecrets && '. Sensitive fields have been redacted.'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="gap-component-md flex flex-col">
              <Button
                onClick={handleDownload}
                size="default"
                className="min-h-[44px] w-full"
              >
                <Download className="mr-2 h-5 w-5" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={state.copySuccess}
                size="default"
                className="min-h-[44px] w-full"
              >
                {state.copySuccess ?
                  <>
                    <CheckCircle2 className="text-success mr-2 h-5 w-5" />
                    Copied!
                  </>
                : <>
                    <Copy className="mr-2 h-5 w-5" />
                    Copy
                  </>
                }
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                size="default"
                className="min-h-[44px] w-full"
              >
                Export Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
