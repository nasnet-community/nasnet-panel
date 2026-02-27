/**
 * ImportTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Dialog for importing alert rule templates from JSON files.
 * Supports file upload or JSON paste with validation.
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
  Label,
  useToast,
  Alert,
  AlertDescription,
} from '@nasnet/ui/primitives';
import { useImportAlertRuleTemplate } from '@nasnet/api-client/queries';
import { alertRuleTemplateImportSchema } from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props for ImportTemplateDialog component
 */
export interface ImportTemplateDialogProps {
  /** @description Whether the dialog is open */
  open: boolean;

  /** @description Callback when dialog is closed */
  onOpenChange: (isOpen: boolean) => void;

  /** @description Callback when template is successfully imported */
  onTemplateImported?: (templateId: string) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ImportTemplateDialog - Import alert rule template from JSON
 *
 * @description Dialog for importing alert rule templates with file upload
 * or JSON paste, including client and server-side validation.
 *
 * @param props - Component props
 * @returns React component
 */
export const ImportTemplateDialog = React.memo(function ImportTemplateDialog(
  props: ImportTemplateDialogProps
) {
  const { open, onOpenChange, onTemplateImported } = props;

  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import template mutation
  const [importTemplate, { loading: isImporting }] = useImportAlertRuleTemplate({
    onCompleted: (result) => {
      if (result.importAlertRuleTemplate.template) {
        toast({
          title: 'Template imported',
          description: `Successfully imported "${result.importAlertRuleTemplate.template.name}"`,
          variant: 'success',
        });
        onTemplateImported?.(result.importAlertRuleTemplate.template.id);
        onOpenChange(false);
        setJsonInput('');
        setValidationError(null);
      } else if (result.importAlertRuleTemplate.errors.length > 0) {
        setValidationError(result.importAlertRuleTemplate.errors[0].message);
      }
    },
    onError: (err) => {
      setValidationError(err.message || 'Failed to import template');
    },
  });

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.json')) {
      setValidationError('Please upload a .json file');
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      setValidationError(null);
    };
    reader.onerror = () => {
      setValidationError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  // Handle JSON textarea change
  const handleJsonChange = useCallback((value: string) => {
    setJsonInput(value);
    setValidationError(null);
  }, []);

  // Validate and import template
  const handleImport = useCallback(async () => {
    try {
      // Parse JSON
      const parsed = JSON.parse(jsonInput);

      // Validate with Zod schema
      const validated = alertRuleTemplateImportSchema.parse(parsed);

      // Import via GraphQL
      await importTemplate({
        variables: {
          json: JSON.stringify(validated),
        },
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        setValidationError('Invalid JSON: ' + error.message);
      } else if (error instanceof Error) {
        setValidationError(error.message);
      } else {
        setValidationError('Failed to validate template');
      }
    }
  }, [jsonInput, importTemplate]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setJsonInput('');
    setValidationError(null);
  }, [onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Template</DialogTitle>
          <DialogDescription>
            Import an alert rule template from a JSON file or paste JSON directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-component-lg">
          {/* File Upload */}
          <div className="space-y-component-sm">
            <Label htmlFor="file-upload">Upload JSON File</Label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="text-muted-foreground file:bg-primary file:text-foreground hover:file:bg-primary/90 block w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-component-sm text-muted-foreground">
                Or paste JSON
              </span>
            </div>
          </div>

          {/* JSON Textarea */}
          <div className="space-y-component-sm">
            <Label htmlFor="json-input">JSON Template</Label>
            <Textarea
              id="json-input"
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder={`{
  "name": "High CPU Alert",
  "description": "Alert when CPU exceeds threshold",
  "category": "RESOURCES",
  "eventType": "device.cpu.high",
  "severity": "WARNING",
  "conditions": [...],
  "channels": ["email", "inapp"],
  "variables": [...]
}`}
              rows={12}
              className="font-mono text-sm"
              aria-label="JSON template input"
              aria-describedby="json-input-description"
            />
            <p
              id="json-input-description"
              className="text-muted-foreground text-xs"
            >
              Paste the JSON content of your alert template
            </p>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-component-sm">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !jsonInput.trim()}
          >
            {isImporting ? 'Importing...' : 'Import Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ImportTemplateDialog.displayName = 'ImportTemplateDialog';
