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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="default" className="min-h-[44px]">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
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
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Upload JSON File</p>
              </div>
            </label>

            {/* Text Area */}
            <div className="space-y-2">
              <Label htmlFor="paste-content-tablet" className="text-base">
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
                className="w-full min-h-[44px]"
              >
                Validate & Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                size="default"
                className="w-full min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Validate */}
        {state.step === 'validate' && (
          <div className="py-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-medium mb-2">Validating...</h3>
            <p className="text-sm text-muted-foreground">Running validation</p>
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
                      <div key={index} className="text-sm">
                        <Badge variant="error" className="mr-2">
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
                    <div key={field} className="space-y-1">
                      <Label htmlFor={`redacted-${field}-tablet`}>{field}</Label>
                      <Input
                        id={`redacted-${field}-tablet`}
                        type={field.toLowerCase().includes('password') ? 'password' : 'text'}
                        placeholder={`Enter ${field}`}
                        value={state.redactedFieldValues[field] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRedactedFieldValue(field, e.target.value)}
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
                        className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px]"
                        onClick={() => setConflictResolution('skip')}
                      >
                        <RadioGroupItem value="skip" id="skip-tablet" />
                        <Label htmlFor="skip-tablet" className="flex-1 cursor-pointer">
                          <span className="font-medium">Skip</span>
                          <p className="text-sm text-muted-foreground">Don't import</p>
                        </Label>
                      </div>
                      <div
                        className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px]"
                        onClick={() => setConflictResolution('rename')}
                      >
                        <RadioGroupItem value="rename" id="rename-tablet" />
                        <Label htmlFor="rename-tablet" className="flex-1 cursor-pointer">
                          <span className="font-medium">Rename</span>
                          <p className="text-sm text-muted-foreground">Auto-rename</p>
                        </Label>
                      </div>
                      <div
                        className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px]"
                        onClick={() => setConflictResolution('replace')}
                      >
                        <RadioGroupItem value="replace" id="replace-tablet" />
                        <Label htmlFor="replace-tablet" className="flex-1 cursor-pointer">
                          <span className="font-medium">Replace</span>
                          <p className="text-sm text-muted-foreground">Replace existing</p>
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
                className="w-full min-h-[44px]"
              >
                Import Service
              </Button>
              <Button
                variant="outline"
                onClick={reset}
                size="default"
                className="w-full min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {state.step === 'importing' && (
          <div className="py-12">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2">Importing...</h3>
            </div>
            <Progress value={state.progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-2">{state.progress}%</p>
          </div>
        )}

        {/* Step 5: Complete */}
        {state.step === 'complete' && (
          <>
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
              <p className="text-sm text-muted-foreground">
                {state.packageData?.service.instanceName} imported
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={reset} size="default" className="w-full min-h-[44px]">
                Import Another
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                size="default"
                className="w-full min-h-[44px]"
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
