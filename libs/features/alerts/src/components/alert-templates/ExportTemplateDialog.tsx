/**
 * ExportTemplateDialog Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Dialog for exporting alert rule templates as JSON files.
 * Provides JSON preview and download functionality.
 *
 * @description Manages the export workflow: fetch template from server,
 * display formatted JSON in a textarea, and provide copy/download options.
 * All actions are reversible (close dialog discards content).
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';
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
} from '@nasnet/ui/primitives';
import { useExportAlertRuleTemplate } from '@nasnet/api-client/queries';

// =============================================================================
// Props Interface
// =============================================================================

export interface ExportTemplateDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;

  /** Template ID to export */
  templateId: string | null;

  /** Template name for filename */
  templateName?: string;

  /** Optional CSS class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ExportTemplateDialog - Export alert rule template as JSON
 *
 * Features:
 * - Fetches template JSON from server
 * - Pretty-printed JSON preview
 * - Copy to clipboard
 * - Download as .json file
 * - Filename based on template name
 *
 * Workflow:
 * 1. User opens dialog for selected template
 * 2. Server exports template as JSON string
 * 3. JSON is displayed in textarea (read-only)
 * 4. User can copy to clipboard OR download file
 * 5. Downloaded file is named: template-name.json
 *
 * Use Cases:
 * - Backup custom templates
 * - Share templates with other users
 * - Version control templates in git
 * - Migrate templates between systems
 *
 * @example
 * ```tsx
 * <ExportTemplateDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   templateId={selectedTemplate?.id}
 *   templateName={selectedTemplate?.name}
 * />
 * ```
 */
function ExportTemplateDialogComponent(props: ExportTemplateDialogProps) {
  const { open, onOpenChange, templateId, templateName, className } = props;

  const { toast } = useToast();
  const [jsonContent, setJsonContent] = useState('');
  const [copied, setCopied] = useState(false);

  // Export template mutation
  const [exportTemplate, { loading }] = useExportAlertRuleTemplate({
    onCompleted: (result) => {
      if (result.exportAlertRuleTemplate) {
        // Pretty-print JSON for display
        try {
          const parsed = JSON.parse(result.exportAlertRuleTemplate);
          const formatted = JSON.stringify(parsed, null, 2);
          setJsonContent(formatted);
        } catch {
          // If parsing fails, use raw JSON
          setJsonContent(result.exportAlertRuleTemplate);
        }
      }
    },
    onError: (err) => {
      toast({
        title: 'Export failed',
        description: err.message || 'Failed to export template',
        variant: 'destructive',
      });
    },
  });

  // Fetch template JSON when dialog opens
  useEffect(() => {
    if (open && templateId) {
      setJsonContent('');
      setCopied(false);
      exportTemplate({
        variables: { id: templateId },
      });
    }
  }, [open, templateId, exportTemplate]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Template JSON copied to clipboard',
        variant: 'success',
      });

      // Reset copied state after 2 seconds
      const timeoutId = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeoutId);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
      return undefined;
    }
  }, [jsonContent, toast]);

  // Download as file
  const handleDownload = useCallback(() => {
    // Generate filename from template name
    const filename = templateName
      ? `${templateName.toLowerCase().replace(/\s+/g, '-')}.json`
      : 'alert-template.json';

    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `Template saved as ${filename}`,
      variant: 'success',
    });
  }, [jsonContent, templateName, toast]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setJsonContent('');
    setCopied(false);
  }, [onOpenChange]);

  // Memoized button disabled state
  const isDisabled = useMemo(() => loading || !jsonContent, [loading, jsonContent]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('sm:max-w-[700px]', className)}>
        <DialogHeader>
          <DialogTitle>Export Template</DialogTitle>
          <DialogDescription>
            {templateName
              ? `Export "${templateName}" as JSON for backup or sharing`
              : 'Export template as JSON'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* JSON Preview */}
          <div className="space-y-2">
            <Label htmlFor="json-preview">Template JSON</Label>
            <Textarea
              id="json-preview"
              value={loading ? 'Loading...' : jsonContent}
              readOnly
              rows={16}
              className="font-mono text-sm"
              aria-label="Template JSON preview"
              aria-busy={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={isDisabled}
              className="flex-1"
              aria-label={copied ? 'Copied to clipboard' : 'Copy JSON to clipboard'}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={isDisabled}
              className="flex-1"
              aria-label="Download JSON file"
            >
              Download JSON
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ExportTemplateDialogComponent.displayName = 'ExportTemplateDialog';

/**
 * Memoized export dialog for preventing unnecessary re-renders.
 * @description Compares props shallowly to determine if re-render is needed.
 * Beneficial when parent component re-renders frequently.
 */
export const ExportTemplateDialog = React.memo(ExportTemplateDialogComponent);
