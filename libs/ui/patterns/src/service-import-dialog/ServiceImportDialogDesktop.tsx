/**
 * ServiceImportDialogDesktop - Desktop presenter for service import dialog
 * Uses Dialog primitive for desktop experience
 * Multi-step wizard: select → validate → resolve → importing → complete
 */

import { useState } from 'react';

import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Checkbox,
} from '@nasnet/ui/primitives';

import { useServiceImportDialog } from './useServiceImportDialog';

import type { ServiceImportDialogProps } from './types';

export function ServiceImportDialogDesktop(props: ServiceImportDialogProps) {
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
    toggleDeviceFilter,
    handleImport,
    reset,
  } = useServiceImportDialog(props);

  const [isDragging, setIsDragging] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange?.(newOpen);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFileUpload(file);
      setSource('file');
    }
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
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      )}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Service Configuration</DialogTitle>
          <DialogDescription>
            {state.step === 'select' && 'Upload a JSON file or paste configuration'}
            {state.step === 'validate' && 'Validating service configuration...'}
            {state.step === 'resolve' && 'Resolve conflicts and provide required information'}
            {state.step === 'importing' && 'Importing service to router'}
            {state.step === 'complete' && 'Import completed successfully'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select */}
        {state.step === 'select' && (
          <div className="space-y-4">
            {/* File Upload / Drag-and-Drop */}
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
            >
              <input
                type="file"
                id="file-upload"
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
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <p className="mb-1 text-sm font-medium">Drop JSON file here or click to browse</p>
                <p className="text-muted-foreground text-xs">
                  Supports service configuration JSON files
                </p>
              </label>
            </div>

            {/* Text Area Paste */}
            <div className="space-y-2">
              <Label htmlFor="paste-content">Or paste JSON content here</Label>
              <Textarea
                id="paste-content"
                placeholder='{"version": "1.0", "service": {...}}'
                value={state.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setContent(e.target.value);
                  setSource('paste');
                }}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {/* Format Help */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Expected format:</p>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-sm">
                  <li>JSON file exported from another NasNetConnect instance</li>
                  <li>Must include version, service configuration, and metadata</li>
                  <li>Redacted secrets will require user input</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!state.content.trim() || loading}
              >
                Validate & Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Validate (loading state) */}
        {state.step === 'validate' && (
          <div className="py-12 text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Upload className="text-primary h-8 w-8 animate-pulse" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Validating configuration...</h3>
            <p className="text-muted-foreground text-sm">Running 7-stage validation pipeline</p>
          </div>
        )}

        {/* Step 3: Resolve */}
        {state.step === 'resolve' && (
          <div className="space-y-4">
            {/* Validation Errors */}
            {state.validationResult && state.validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Validation Errors ({state.validationResult.errors.length})</Label>
                <ScrollArea className="h-48 rounded-lg border p-4">
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
                        <span className="text-error font-mono">{error.field || 'global'}:</span>{' '}
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
                <div className="space-y-2">
                  <Label>Provide Values for Redacted Fields</Label>
                  <div className="space-y-3 rounded-lg border p-4">
                    {state.validationResult.redactedFields.map((field: string) => (
                      <div
                        key={field}
                        className="space-y-1"
                      >
                        <Label
                          htmlFor={`redacted-${field}`}
                          className="text-sm"
                        >
                          {field}
                        </Label>
                        <Input
                          id={`redacted-${field}`}
                          type={field.toLowerCase().includes('password') ? 'password' : 'text'}
                          placeholder={`Enter ${field}`}
                          value={state.redactedFieldValues[field] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setRedactedFieldValue(field, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Conflict Resolution */}
            {state.validationResult?.conflictingInstances &&
              state.validationResult.conflictingInstances.length > 0 && (
                <div className="space-y-2">
                  <Label>Conflicting Services Detected</Label>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {state.validationResult.conflictingInstances.length} service(s) with
                      conflicting ports or names found.
                    </AlertDescription>
                  </Alert>
                  <RadioGroup
                    value={state.conflictResolution}
                    onValueChange={setConflictResolution}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2 rounded-lg border p-3">
                        <RadioGroupItem
                          value="skip"
                          id="conflict-skip"
                        />
                        <Label
                          htmlFor="conflict-skip"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Skip</span>
                          <p className="text-muted-foreground text-sm">
                            Don't import if conflicts exist
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 rounded-lg border p-3">
                        <RadioGroupItem
                          value="rename"
                          id="conflict-rename"
                        />
                        <Label
                          htmlFor="conflict-rename"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Rename</span>
                          <p className="text-muted-foreground text-sm">
                            Auto-rename to avoid conflicts
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 rounded-lg border p-3">
                        <RadioGroupItem
                          value="replace"
                          id="conflict-replace"
                        />
                        <Label
                          htmlFor="conflict-replace"
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">Replace</span>
                          <p className="text-muted-foreground text-sm">
                            Replace existing service (destructive)
                          </p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={reset}
              >
                Back
              </Button>
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
              >
                Import Service
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {state.step === 'importing' && (
          <div className="py-12">
            <div className="mb-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Download className="text-primary h-8 w-8 animate-pulse" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Importing service...</h3>
              <p className="text-muted-foreground text-sm">Creating service instance on router</p>
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
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle2 className="text-success h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Import Complete!</h3>
              <p className="text-muted-foreground text-sm">
                Service {state.packageData?.service.instanceName} has been imported successfully
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={reset}>Import Another</Button>
              <Button
                variant="default"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
