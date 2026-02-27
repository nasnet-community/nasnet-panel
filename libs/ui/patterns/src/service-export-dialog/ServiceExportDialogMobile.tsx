/**
 * ServiceExportDialogMobile - Mobile presenter for service export dialog
 * Uses Sheet primitive for mobile experience with 44px touch targets
 */

import { Download, Copy, CheckCircle2, Share2, AlertCircle, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
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

export function ServiceExportDialogMobile(props: ServiceExportDialogProps) {
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
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] w-full"
          >
            <Share2 className="mr-2 h-5 w-5" />
            Export
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-card border-border h-[90vh] border-t"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-foreground text-lg font-semibold">
            Export Service
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {instance.instanceName} ({instance.featureID})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6">
          {state.step === 'configure' && (
            <>
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
                        id="format-json-mobile"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="format-json-mobile"
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">JSON File</span>
                            <Badge variant="secondary">.json</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Downloadable file for manual import
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
                        id="format-qr-mobile"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="format-qr-mobile"
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">QR Code</span>
                            <Badge variant="secondary">.png</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Scannable QR code (2KB limit)
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
                      htmlFor="redact-secrets-mobile"
                      className="text-base"
                    >
                      Redact Secrets
                    </Label>
                    <p className="text-muted-foreground text-sm">Hide passwords and API keys</p>
                  </div>
                  <Switch
                    id="redact-secrets-mobile"
                    checked={state.options.redactSecrets}
                    onCheckedChange={(checked: boolean) => setOptions({ redactSecrets: checked })}
                  />
                </div>

                <div className="flex min-h-[44px] items-center justify-between">
                  <div className="flex-1 space-y-0.5">
                    <Label
                      htmlFor="include-routing-mobile"
                      className="text-base"
                    >
                      Include Routing
                    </Label>
                    <p className="text-muted-foreground text-sm">Export routing assignments</p>
                  </div>
                  <Switch
                    id="include-routing-mobile"
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
              <div className="space-y-component-md">
                <Button
                  onClick={handleExport}
                  disabled={loading}
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  {loading ? 'Exporting...' : `Export as ${state.options.format.toUpperCase()}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {state.step === 'exporting' && (
            <div className="py-12 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <Share2 className="text-primary h-10 w-10 animate-pulse" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Preparing export...</h3>
              <p className="text-muted-foreground text-sm">
                Generating {state.options.format.toUpperCase()} package
              </p>
            </div>
          )}

          {state.step === 'complete' && (
            <>
              {/* Success Message */}
              <div className="py-4 text-center">
                <div className="bg-success/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                  <CheckCircle2 className="text-success h-10 w-10" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Export Complete!</h3>
                <p className="text-muted-foreground text-sm">{instance.instanceName} exported</p>
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
                    JSON file ready for download
                    {state.options.redactSecrets && '. Secrets have been redacted.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="space-y-component-md">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={state.copySuccess}
                  size="lg"
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
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  Export Another
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
