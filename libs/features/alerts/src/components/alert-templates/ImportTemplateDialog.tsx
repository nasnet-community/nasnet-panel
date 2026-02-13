/**
 * ImportTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Dialog for importing alert rule templates from JSON files.
 * Supports file upload or JSON paste with validation.
 */

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

export interface ImportTemplateDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;

  /** Callback when template is successfully imported */
  onTemplateImported?: (templateId: string) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ImportTemplateDialog - Import alert rule template from JSON
 *
 * Features:
 * - File upload (.json files)
 * - JSON paste into textarea
 * - Client-side validation with Zod schema
 * - Server-side validation via GraphQL mutation
 * - Error display with specific field errors
 * - Success feedback with toast notification
 *
 * Workflow:
 * 1. User opens dialog
 * 2. User uploads .json file OR pastes JSON
 * 3. Client validates JSON structure
 * 4. Server validates template data
 * 5. Template is imported and appears in browser
 *
 * Validation:
 * - JSON must be valid
 * - Must match AlertRuleTemplate schema
 * - Event type must exist
 * - Conditions must be valid
 * - Variables must be properly defined
 */
export function ImportTemplateDialog(props: ImportTemplateDialogProps) {
  const { open, onOpenChange, onTemplateImported } = props;

  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Import template mutation
  const [importTemplate, { loading }] = useImportAlertRuleTemplate({
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
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    []
  );

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Import Template</DialogTitle>
          <DialogDescription>
            Import an alert rule template from a JSON file or paste JSON directly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload JSON File</Label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-white
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
            </div>
          </div>

          {/* JSON Textarea */}
          <div className="space-y-2">
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
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !jsonInput.trim()}>
            {loading ? 'Importing...' : 'Import Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
