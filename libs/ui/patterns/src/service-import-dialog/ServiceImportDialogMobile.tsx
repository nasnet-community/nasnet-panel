/**
 * ServiceImportDialogMobile - Mobile presenter for service import dialog
 * Uses Sheet primitive for mobile experience with 44px touch targets
 * Multi-step wizard optimized for mobile
 */

import { Upload, FileText, AlertCircle, CheckCircle2, Download, ChevronLeft } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
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

export function ServiceImportDialogMobile(props: ServiceImportDialogProps) {
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="w-full min-h-[44px]">
            <Upload className="w-5 h-5 mr-2" />
            Import
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Import Service</SheetTitle>
          <SheetDescription>
            {state.step === 'select' && 'Upload JSON file or paste configuration'}
            {state.step === 'validate' && 'Validating configuration...'}
            {state.step === 'resolve' && 'Resolve conflicts'}
            {state.step === 'importing' && 'Importing to router'}
            {state.step === 'complete' && 'Import complete'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6">
          {/* Step 1: Select */}
          {state.step === 'select' && (
            <>
              {/* File Upload */}
              <div className="space-y-3">
                <input
                  type="file"
                  id="file-upload-mobile"
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
                <label htmlFor="file-upload-mobile">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload JSON File</p>
                  </div>
                </label>
              </div>

              {/* Text Area Paste */}
              <div className="space-y-2">
                <Label htmlFor="paste-content-mobile" className="text-base">
                  Or paste JSON here
                </Label>
                <Textarea
                  id="paste-content-mobile"
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
                  onClick={handleValidate}
                  disabled={!state.content.trim() || loading}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  Validate & Continue
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

          {/* Step 2: Validate */}
          {state.step === 'validate' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mb-2">Validating...</h3>
              <p className="text-sm text-muted-foreground">
                Running validation pipeline
              </p>
            </div>
          )}

          {/* Step 3: Resolve */}
          {state.step === 'resolve' && (
            <>
              {/* Validation Errors */}
              {state.validationResult && state.validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base">
                    Errors ({state.validationResult.errors.length})
                  </Label>
                  <ScrollArea className="h-40 rounded-lg border p-3">
                    <div className="space-y-2">
                      {state.validationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          <Badge variant="error" className="mr-2 text-xs">
                            {error.code}
                          </Badge>
                          <span className="text-xs">{error.message}</span>
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
                        <Label htmlFor={`redacted-${field}-mobile`} className="text-sm">
                          {field}
                        </Label>
                        <Input
                          id={`redacted-${field}-mobile`}
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

              {/* Conflict Resolution */}
              {state.validationResult?.conflictingInstances &&
                state.validationResult.conflictingInstances.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base">Resolve Conflicts</Label>
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription>
                        {state.validationResult.conflictingInstances.length} conflicting
                        service(s)
                      </AlertDescription>
                    </Alert>
                    <RadioGroup
                      value={state.conflictResolution}
                      onValueChange={setConflictResolution}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px] cursor-pointer"
                          onClick={() => setConflictResolution('skip')}
                        >
                          <RadioGroupItem value="skip" id="conflict-skip-mobile" />
                          <Label htmlFor="conflict-skip-mobile" className="cursor-pointer flex-1">
                            <span className="font-medium">Skip</span>
                            <p className="text-sm text-muted-foreground">Don't import</p>
                          </Label>
                        </div>
                        <div
                          className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px] cursor-pointer"
                          onClick={() => setConflictResolution('rename')}
                        >
                          <RadioGroupItem value="rename" id="conflict-rename-mobile" />
                          <Label htmlFor="conflict-rename-mobile" className="cursor-pointer flex-1">
                            <span className="font-medium">Rename</span>
                            <p className="text-sm text-muted-foreground">Auto-rename</p>
                          </Label>
                        </div>
                        <div
                          className="flex items-start space-x-3 rounded-lg border p-4 min-h-[44px] cursor-pointer"
                          onClick={() => setConflictResolution('replace')}
                        >
                          <RadioGroupItem value="replace" id="conflict-replace-mobile" />
                          <Label
                            htmlFor="conflict-replace-mobile"
                            className="cursor-pointer flex-1"
                          >
                            <span className="font-medium">Replace</span>
                            <p className="text-sm text-muted-foreground">Replace existing</p>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}

              {/* Actions */}
              <div className="space-y-3">
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
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  Import Service
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Importing */}
          {state.step === 'importing' && (
            <div className="py-12">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-medium mb-2">Importing...</h3>
                <p className="text-sm text-muted-foreground">Creating service instance</p>
              </div>
              <Progress value={state.progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                {state.progress}%
              </p>
            </div>
          )}

          {/* Step 5: Complete */}
          {state.step === 'complete' && (
            <>
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  {state.packageData?.service.instanceName} imported
                </p>
              </div>
              <div className="space-y-3">
                <Button onClick={reset} size="lg" className="w-full min-h-[44px]">
                  Import Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  size="lg"
                  className="w-full min-h-[44px]"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
