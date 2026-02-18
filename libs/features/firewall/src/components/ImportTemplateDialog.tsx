/**
 * ImportTemplateDialog - Import custom firewall templates
 *
 * Features:
 * - File upload (JSON/YAML)
 * - Drag-and-drop support
 * - Zod validation with detailed errors
 * - Preview before import
 * - Conflict detection for duplicate names
 *
 * @module @nasnet/features/firewall/components
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, FileJson, FileCode } from 'lucide-react';
import yaml from 'js-yaml';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@nasnet/ui/primitives/dialog';
import { Button } from '@nasnet/ui/primitives/button';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Badge } from '@nasnet/ui/primitives/badge';
import { ScrollArea } from '@nasnet/ui/primitives/scroll-area';
import { Separator } from '@nasnet/ui/primitives/separator';
import type { FirewallTemplate } from '../schemas/templateSchemas';
import {
  validateTemplate,
  validateImportFormat,
  type TemplateValidationResult,
} from '../utils/template-validator';

// ============================================
// TYPE DEFINITIONS
// ============================================

type ImportStep = 'upload' | 'validating' | 'preview' | 'importing' | 'complete';

interface ParsedTemplateData {
  template: FirewallTemplate;
  validation: TemplateValidationResult;
  format: 'json' | 'yaml';
  fileName: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ImportTemplateDialogProps {
  /** Existing template names (for conflict detection) */
  existingNames?: string[];
  /** Callback when template is imported */
  onImport: (template: FirewallTemplate) => Promise<void>;
  /** Trigger element */
  trigger?: React.ReactNode;
  /** Whether dialog is open (controlled mode) */
  open?: boolean;
  /** Callback when open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;
}

// ============================================
// COMPONENT
// ============================================

export function ImportTemplateDialog({
  existingNames = [],
  onImport,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ImportTemplateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTemplateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const handleReset = useCallback(() => {
    setStep('upload');
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        handleReset();
      }
      setOpen(newOpen);
    },
    [handleReset, setOpen]
  );

  const parseFile = useCallback(
    async (content: string, fileName: string) => {
      setStep('validating');
      setError(null);

      try {
        // Detect format
        const formatCheck = validateImportFormat(content);
        if (!formatCheck.valid) {
          throw new Error(formatCheck.error || 'Invalid file format');
        }

        const format = formatCheck.format!;

        // Parse content
        let parsed: unknown;
        if (format === 'json') {
          parsed = JSON.parse(content);
        } else {
          parsed = yaml.load(content);
        }

        // Handle array of templates (import first one for now)
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            throw new Error('File contains no templates');
          }
          parsed = parsed[0];
        }

        // Validate structure
        const validation = validateTemplate(parsed);

        if (!validation.success) {
          setParsedData({
            template: parsed as FirewallTemplate,
            validation,
            format,
            fileName,
          });
          setStep('preview');
          return;
        }

        // Check for name conflicts
        const template = validation.data!;
        const hasConflict = existingNames.some(
          (name) => name.toLowerCase() === template.name.toLowerCase()
        );

        if (hasConflict) {
          validation.warnings.push(
            `A template named "${template.name}" already exists and will be replaced`
          );
        }

        setParsedData({
          template,
          validation,
          format,
          fileName,
        });
        setStep('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
        setStep('upload');
      }
    },
    [existingNames]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        parseFile(content, file.name);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        // Check file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'json' && extension !== 'yaml' && extension !== 'yml') {
          setError('Please upload a JSON or YAML file');
          return;
        }
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedData?.template) return;

    setStep('importing');
    setError(null);

    try {
      await onImport(parsedData.template);
      setStep('complete');
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import template');
      setStep('preview');
    }
  }, [parsedData, onImport, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Import a firewall template from JSON or YAML file
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex gap-4">
                <FileJson className="h-12 w-12 text-muted-foreground" />
                <FileCode className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Drop a template file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {/* Supported Formats */}
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Supported Formats</p>
              <div className="flex gap-2">
                <Badge variant="secondary">JSON (.json)</Badge>
                <Badge variant="secondary">YAML (.yaml, .yml)</Badge>
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Validating Step */}
        {step === 'validating' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium">Validating template...</p>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && parsedData && (
          <div className="space-y-4">
            {/* Template Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {parsedData.template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.template.description}
                  </p>
                </div>
                <Badge variant={parsedData.validation.success ? 'default' : 'error'}>
                  {parsedData.format.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {parsedData.template.category}
                </Badge>
                <Badge variant="outline">
                  {parsedData.template.complexity}
                </Badge>
                <Badge variant="outline">
                  {parsedData.template.ruleCount} rules
                </Badge>
                <Badge variant="outline">
                  v{parsedData.template.version}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Validation Results */}
            <ScrollArea className="max-h-60">
              {parsedData.validation.success ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Template is valid and ready to import
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Validation Errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {parsedData.validation.errors.map((err, i) => (
                        <li key={i} className="text-sm">
                          {err.field ? `${err.field}: ` : ''}{err.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {parsedData.validation.warnings.length > 0 && (
                <Alert variant="default" className="mt-3">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Warnings:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {parsedData.validation.warnings.map((warning, i) => (
                        <li key={i} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>

            {/* Variables */}
            {parsedData.template.variables.length > 0 && (
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">
                  Template Variables ({parsedData.template.variables.length})
                </p>
                <div className="space-y-2">
                  {parsedData.template.variables.slice(0, 5).map((variable, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{variable.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {variable.type}
                      </Badge>
                    </div>
                  ))}
                  {parsedData.template.variables.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{parsedData.template.variables.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium">Importing template...</p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <p className="text-lg font-medium">Template imported successfully!</p>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!parsedData?.validation.success}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Template
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
