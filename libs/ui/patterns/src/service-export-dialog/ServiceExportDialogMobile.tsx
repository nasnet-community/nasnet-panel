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
} from '@nasnet/ui/primitives/sheet';
import { Button } from '@nasnet/ui/primitives/button';
import { Label } from '@nasnet/ui/primitives/label';
import { RadioGroup, RadioGroupItem } from '@nasnet/ui/primitives/radio-group';
import { Switch } from '@nasnet/ui/primitives/switch';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Badge } from '@nasnet/ui/primitives/badge';
import type { ServiceExportDialogProps } from './types';
import { useServiceExportDialog } from './useServiceExportDialog';

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="w-full min-h-[44px]">
            <Share2 className="w-5 h-5 mr-2" />
            Export
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Export Service</SheetTitle>
          <SheetDescription>
            {instance.instanceName} ({instance.featureID})
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6">
          {state.step === 'configure' && (
            <>
              {/* Format Selection */}
              <div className="space-y-3">
                <Label className="text-base">Export Format</Label>
                <RadioGroup value={state.options.format} onValueChange={setFormat}>
                  <div className="space-y-3">
                    {/* JSON Format */}
                    <div
                      className={`flex items-start space-x-3 rounded-lg border p-4 min-h-[44px] cursor-pointer transition-colors ${
                        state.options.format === 'json'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setFormat('json')}
                    >
                      <RadioGroupItem value="json" id="format-json-mobile" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="format-json-mobile" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">JSON File</span>
                            <Badge variant="secondary">.json</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Downloadable file for manual import
                          </p>
                        </label>
                      </div>
                    </div>

                    {/* QR Code Format */}
                    <div
                      className={`flex items-start space-x-3 rounded-lg border p-4 min-h-[44px] cursor-pointer transition-colors ${
                        state.options.format === 'qr'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setFormat('qr')}
                    >
                      <RadioGroupItem value="qr" id="format-qr-mobile" className="mt-1" />
                      <div className="flex-1">
                        <label htmlFor="format-qr-mobile" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">QR Code</span>
                            <Badge variant="secondary">.png</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Scannable QR code (2KB limit)
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Export Options */}
              <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center justify-between min-h-[44px]">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="redact-secrets-mobile" className="text-base">
                      Redact Secrets
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Hide passwords and API keys
                    </p>
                  </div>
                  <Switch
                    id="redact-secrets-mobile"
                    checked={state.options.redactSecrets}
                    onCheckedChange={(checked) => setOptions({ redactSecrets: checked })}
                  />
                </div>

                <div className="flex items-center justify-between min-h-[44px]">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="include-routing-mobile" className="text-base">
                      Include Routing
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Export routing assignments
                    </p>
                  </div>
                  <Switch
                    id="include-routing-mobile"
                    checked={state.options.includeRoutingRules}
                    onCheckedChange={(checked) => setOptions({ includeRoutingRules: checked })}
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
              <div className="space-y-3">
                <Button
                  onClick={handleExport}
                  disabled={loading}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  {loading ? 'Exporting...' : `Export as ${state.options.format.toUpperCase()}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {state.step === 'exporting' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2">Preparing export...</h3>
              <p className="text-sm text-muted-foreground">
                Generating {state.options.format.toUpperCase()} package
              </p>
            </div>
          )}

          {state.step === 'complete' && (
            <>
              {/* Success Message */}
              <div className="text-center py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-lg font-medium mb-2">Export Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  {instance.instanceName} exported
                </p>
              </div>

              {/* QR Code Preview */}
              {state.options.format === 'qr' && state.qrImageData && (
                <div className="flex justify-center">
                  <div className="rounded-lg border p-4 bg-white">
                    <img
                      src={`data:image/png;base64,${state.qrImageData}`}
                      alt="Service Configuration QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                </div>
              )}

              {/* JSON Preview */}
              {state.options.format === 'json' && (
                <Alert>
                  <AlertDescription>
                    JSON file ready for download
                    {state.options.redactSecrets &&
                      '. Secrets have been redacted.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={state.copySuccess}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  {state.copySuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  size="lg"
                  className="w-full min-h-[44px]"
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
