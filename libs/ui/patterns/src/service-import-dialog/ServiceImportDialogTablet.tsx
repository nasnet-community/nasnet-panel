/**
 * ServiceImportDialogTablet - Tablet presenter for service import dialog
 * Hybrid approach: Dialog primitive with mobile-friendly spacing
 */

import { Upload, AlertCircle, CheckCircle2, Download, ChevronLeft } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  Button,
  Label,
  Textarea,
  Input,
  Progress,
  Alert,
  AlertDescription,
  Badge,
  ScrollArea,
  RadioGroup,
  RadioGroupItem,
} from '@nasnet/ui/primitives';

import { useServiceImportDialog } from './useServiceImportDialog';

import type { ServiceImportDialogProps } from './types';

export function ServiceImportDialogTablet(props: ServiceImportDialogProps) {
  const { open, onOpenChange, trigger } = props;
  const {
    state,
    loading,
    setSource,
    setContent,
    handleFileUpload,
    handleValidate,
    setRedactedFieldValue,
    setConflictResolution,
    handleImport,
    reset,
  } = useServiceImportDialog(props);

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
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Service Configuration</DialogTitle>
          <DialogDescription>
            {state.step === 'select' && 'Upload JSON or paste configuration'}
            {state.step === 'validate' && 'Validating...'}
            {state.step === 'resolve' && 'Resolve conflicts'}
            {state.step === 'importing' && 'Importing service'}
            {state.step === 'complete' && 'Import complete'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select */}
        {state.step === 'select' && (
          <div className="space-y-4">
            {/* File Upload */}
            <input
              type="file"
              id="file-upload-tablet"
              className="hidden"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                  setSource('file');
                }
              }}
            />
            <label htmlFor="file-upload-tablet">
              <div className="hover:bg-accent cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors">
                <Upload className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                <p className="text-sm font-medium">Upload JSON File</p>
              </div>
            </label>

            {/* Text Area */}
            <div className="space-y-2">
              <Label
                htmlFor="paste-content-tablet"
                className="text-base"
              >
                Or paste JSON configuration
              </Label>
              <Textarea
                id="paste-content-tablet"
                placeholder="Paste configuration..."
                value={state.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setContent(e.target.value);
                  setSource('paste');
                }}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Error */}
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleValidate}
                disabled={!state.content.trim() || loading}
                size="default"
                className="min-h-[44px] w-full"
              >
                Validate & Continue
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

        {/* Step 2: Validate */}
        {state.step === 'validate' && (
          <div className="py-12 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Upload className="text-primary h-8 w-8 animate-pulse" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Validating...</h3>
            <p className="text-muted-foreground text-sm">Running validation</p>
          </div>
        )}

        {/* Step 3: Resolve */}
        {state.step === 'resolve' && (
          <div className="space-y-4">
            {/* Errors */}
            {state.validationResult && state.validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base">Errors ({state.validationResult.errors.length})</Label>
                <ScrollArea className="h-40 rounded-lg border p-3">
                  <div className="space-y-2">
                    {state.validationResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm"
                      >
                        <Badge
                          variant="error"
                          className="mr-2"
                        >
                          {error.code}
                        </Badge>
                        {error.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Redacted Fields */}
            {state.validationResult?.redactedFields &&
              state.validationResult.redactedFields.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base">Provide Missing Values</Label>
                  {state.validationResult.redactedFields.map((field: string) => (
                    <div
                      key={field}
                      className="space-y-1"
                    >
                      <Label htmlFor={`redacted-${field}-tablet`}>{field}</Label>
                      <Input
                        id={`redacted-${field}-tablet`}
                        type={field.toLowerCase().includes('password') ? 'password' : 'text'}
                        placeholder={`Enter ${field}`}
                        value={state.redactedFieldValues[field] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setRedactedFieldValue(field, e.target.value)
                        }
                        className="min-h-[44px]"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* Conflicts */}
            {state.validationResult?.conflictingInstances &&
              state.validationResult.conflictingInstances.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base">Resolve Conflicts</Label>
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription>
                      {state.validationResult.conflictingInstances.length} conflict(s)
                    </AlertDescription>
                  </Alert>
                  <RadioGroup
                    value={state.conflictResolution}
                    onValueChange={setConflictResolution}
                  >
                    <div className="space-y-3">
                      <div
                        className="flex min-h-[44px] items-start space-x-3 rounded-lg border p-4"
                        onClick={() => setConflictResolution('skip')}
                      >
                        <RadioGroupItem
                          value="skip"
                          id="skip-tablet"
                        />
                        <Label
                          htmlFor="skip-tablet"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Skip</span>
                          <p className="text-muted-foreground text-sm">Don't import</p>
                        </Label>
                      </div>
                      <div
                        className="flex min-h-[44px] items-start space-x-3 rounded-lg border p-4"
                        onClick={() => setConflictResolution('rename')}
                      >
                        <RadioGroupItem
                          value="rename"
                          id="rename-tablet"
                        />
                        <Label
                          htmlFor="rename-tablet"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Rename</span>
                          <p className="text-muted-foreground text-sm">Auto-rename</p>
                        </Label>
                      </div>
                      <div
                        className="flex min-h-[44px] items-start space-x-3 rounded-lg border p-4"
                        onClick={() => setConflictResolution('replace')}
                      >
                        <RadioGroupItem
                          value="replace"
                          id="replace-tablet"
                        />
                        <Label
                          htmlFor="replace-tablet"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Replace</span>
                          <p className="text-muted-foreground text-sm">Replace existing</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleImport}
                disabled={
                  (state.validationResult?.requiresUserInput &&
                    (!state.conflictResolution ||
                      (state.validationResult.redactedFields &&
                        state.validationResult.redactedFields.some(
                          (field: string) => !state.redactedFieldValues[field]
                        )))) ||
                  loading
                }
                size="default"
                className="min-h-[44px] w-full"
              >
                Import Service
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                size="default"
                className="min-h-[44px] w-full"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {state.step === 'importing' && (
          <div className="py-12">
            <div className="mb-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <Download className="text-primary h-8 w-8 animate-pulse" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Importing...</h3>
            </div>
            <Progress
              value={state.progress}
              className="w-full"
            />
            <p className="text-muted-foreground mt-2 text-center text-sm">{state.progress}%</p>
          </div>
        )}

        {/* Step 5: Complete */}
        {state.step === 'complete' && (
          <>
            <div className="py-8 text-center">
              <div className="bg-success/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <CheckCircle2 className="text-success h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Import Complete!</h3>
              <p className="text-muted-foreground text-sm">
                {state.packageData?.service.instanceName} imported
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={reset}
                size="default"
                className="min-h-[44px] w-full"
              >
                Import Another
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                size="default"
                className="min-h-[44px] w-full"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
