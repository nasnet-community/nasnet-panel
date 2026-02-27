/**
 * ServiceExportDialogDesktop - Desktop presenter for service export dialog
 * Uses Dialog primitive for desktop experience
 */

import { Download, Copy, CheckCircle2, Share2, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Alert,
  AlertDescription,
  Badge,
  ScrollArea,
} from '@nasnet/ui/primitives';

import { useServiceExportDialog } from './useServiceExportDialog';

import type { ServiceExportDialogProps } from './types';

export function ServiceExportDialogDesktop(props: ServiceExportDialogProps) {
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
      {trigger || (
        <Button
          variant="outline"
          size="sm"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Export
        </Button>
      )}
      <DialogContent className="bg-card border-border max-w-2xl rounded-[var(--semantic-radius-modal)] border p-6 shadow-[var(--semantic-shadow-modal)]">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-lg font-semibold">
            Export Service Configuration
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Export {instance.instanceName} ({instance.featureID}) as JSON or QR code
          </DialogDescription>
        </DialogHeader>

        {state.step === 'configure' && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup
                value={state.options.format}
                onValueChange={setFormat}
              >
                <div className="gap-component-md grid grid-cols-2">
                  {/* JSON Format */}
                  <div
                    className={`p-component-md flex cursor-pointer items-start space-x-3 rounded-[var(--semantic-radius-input)] border transition-colors ${
                      state.options.format === 'json' ?
                        'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormat('json')}
                  >
                    <RadioGroupItem
                      value="json"
                      id="format-json"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="format-json"
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
                    className={`p-component-md flex cursor-pointer items-start space-x-3 rounded-[var(--semantic-radius-input)] border transition-colors ${
                      state.options.format === 'qr' ?
                        'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                    }`}
                    onClick={() => setFormat('qr')}
                  >
                    <RadioGroupItem
                      value="qr"
                      id="format-qr"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="format-qr"
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="redact-secrets">Redact Secrets</Label>
                  <p className="text-muted-foreground text-sm">
                    Hide passwords, API keys, and sensitive data
                  </p>
                </div>
                <Switch
                  id="redact-secrets"
                  checked={state.options.redactSecrets}
                  onCheckedChange={(checked: boolean) => setOptions({ redactSecrets: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-routing">Include Routing Rules</Label>
                  <p className="text-muted-foreground text-sm">
                    Export device-to-service routing assignments
                  </p>
                </div>
                <Switch
                  id="include-routing"
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="gap-component-sm flex justify-end">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? 'Exporting...' : `Export as ${state.options.format.toUpperCase()}`}
              </Button>
            </div>
          </div>
        )}

        {state.step === 'exporting' && (
          <div className="py-12 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
              <div className="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
                    {state.options.redactSecrets &&
                      '. Sensitive fields have been redacted and will require user input during import.'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="gap-component-sm flex justify-between">
              <Button
                variant="outline"
                onClick={reset}
              >
                Export Another
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={state.copySuccess}
                >
                  {state.copySuccess ?
                    <>
                      <CheckCircle2 className="text-success mr-2 h-4 w-4" />
                      Copied!
                    </>
                  : <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  }
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
