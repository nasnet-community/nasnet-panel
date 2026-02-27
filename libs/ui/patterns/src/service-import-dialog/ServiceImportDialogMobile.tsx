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
            <Upload className="mr-2 h-5 w-5" />
            Import
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[90vh]"
      >
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
                  <div className="hover:bg-accent cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors">
                    <Upload className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                    <p className="text-sm font-medium">Upload JSON File</p>
                  </div>
                </label>
              </div>

              {/* Text Area Paste */}
              <div className="space-y-2">
                <Label
                  htmlFor="paste-content-mobile"
                  className="text-base"
                >
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
                  className="min-h-[44px] w-full"
                >
                  Validate & Continue
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

          {/* Step 2: Validate */}
          {state.step === 'validate' && (
            <div className="py-12 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <Upload className="text-primary h-10 w-10 animate-pulse" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Validating...</h3>
              <p className="text-muted-foreground text-sm">Running validation pipeline</p>
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
                        <div
                          key={index}
                          className="text-sm"
                        >
                          <Badge
                            variant="error"
                            className="mr-2 text-xs"
                          >
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
                      <div
                        key={field}
                        className="space-y-1"
                      >
                        <Label
                          htmlFor={`redacted-${field}-mobile`}
                          className="text-sm"
                        >
                          {field}
                        </Label>
                        <Input
                          id={`redacted-${field}-mobile`}
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

              {/* Conflict Resolution */}
              {state.validationResult?.conflictingInstances &&
                state.validationResult.conflictingInstances.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base">Resolve Conflicts</Label>
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription>
                        {state.validationResult.conflictingInstances.length} conflicting service(s)
                      </AlertDescription>
                    </Alert>
                    <RadioGroup
                      value={state.conflictResolution}
                      onValueChange={setConflictResolution}
                    >
                      <div className="space-y-3">
                        <div
                          className="flex min-h-[44px] cursor-pointer items-start space-x-3 rounded-lg border p-4"
                          onClick={() => setConflictResolution('skip')}
                        >
                          <RadioGroupItem
                            value="skip"
                            id="conflict-skip-mobile"
                          />
                          <Label
                            htmlFor="conflict-skip-mobile"
                            className="flex-1 cursor-pointer"
                          >
                            <span className="font-medium">Skip</span>
                            <p className="text-muted-foreground text-sm">Don't import</p>
                          </Label>
                        </div>
                        <div
                          className="flex min-h-[44px] cursor-pointer items-start space-x-3 rounded-lg border p-4"
                          onClick={() => setConflictResolution('rename')}
                        >
                          <RadioGroupItem
                            value="rename"
                            id="conflict-rename-mobile"
                          />
                          <Label
                            htmlFor="conflict-rename-mobile"
                            className="flex-1 cursor-pointer"
                          >
                            <span className="font-medium">Rename</span>
                            <p className="text-muted-foreground text-sm">Auto-rename</p>
                          </Label>
                        </div>
                        <div
                          className="flex min-h-[44px] cursor-pointer items-start space-x-3 rounded-lg border p-4"
                          onClick={() => setConflictResolution('replace')}
                        >
                          <RadioGroupItem
                            value="replace"
                            id="conflict-replace-mobile"
                          />
                          <Label
                            htmlFor="conflict-replace-mobile"
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
                  className="min-h-[44px] w-full"
                >
                  Import Service
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Importing */}
          {state.step === 'importing' && (
            <div className="py-12">
              <div className="mb-6 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                  <Download className="text-primary h-10 w-10 animate-pulse" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Importing...</h3>
                <p className="text-muted-foreground text-sm">Creating service instance</p>
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
                  <CheckCircle2 className="text-success h-10 w-10" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Import Complete!</h3>
                <p className="text-muted-foreground text-sm">
                  {state.packageData?.service.instanceName} imported
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={reset}
                  size="lg"
                  className="min-h-[44px] w-full"
                >
                  Import Another
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  size="lg"
                  className="min-h-[44px] w-full"
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
