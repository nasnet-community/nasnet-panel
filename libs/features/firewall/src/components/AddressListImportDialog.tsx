/**
 * AddressListImportDialog - Bulk import address list entries
 * Supports CSV, JSON, and TXT formats with drag-and-drop and paste
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@nasnet/ui/primitives/dialog';
import { Button } from '@nasnet/ui/primitives/button';
import { Label } from '@nasnet/ui/primitives/label';
import { Textarea } from '@nasnet/ui/primitives/textarea';
import { Progress } from '@nasnet/ui/primitives/progress';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Badge } from '@nasnet/ui/primitives/badge';
import { ScrollArea } from '@nasnet/ui/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nasnet/ui/primitives/select';
import { Input } from '@nasnet/ui/primitives/input';
import {
  parseAddressList,
  validateInBatches,
  detectFormat,
  type ParseResult,
  type ParsedAddress,
} from '../utils/addressListParsers';

export interface AddressListImportDialogProps {
  /** Router ID for the import */
  routerId: string;
  /** Callback when import is completed */
  onImport?: (listName: string, entries: ParsedAddress[]) => Promise<void>;
  /** Available list names for autocomplete */
  existingLists?: string[];
}

type ImportStep = 'select' | 'preview' | 'importing' | 'complete';

export function AddressListImportDialog({
  routerId,
  onImport,
  existingLists = [],
}: AddressListImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>('select');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'auto' | 'csv' | 'json' | 'txt'>('auto');
  const [targetList, setTargetList] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setStep('select');
    setContent('');
    setFormat('auto');
    setTargetList('');
    setParseResult(null);
    setImportProgress(0);
    setImportError(null);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);

      // Auto-detect format from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') setFormat('csv');
      else if (extension === 'json') setFormat('json');
      else if (extension === 'txt') setFormat('txt');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleParse = useCallback(async () => {
    if (!content.trim()) {
      return;
    }

    const detectedFormat = format === 'auto' ? detectFormat(content) : format;
    const result = parseAddressList(content, detectedFormat === 'auto' ? undefined : detectedFormat);

    // For large imports, validate in batches
    if (result.data.length > 100) {
      const validatedResult = await validateInBatches(
        result.data,
        100,
        (current, total) => {
          setImportProgress((current / total) * 50); // First 50% for validation
        }
      );
      setParseResult(validatedResult);
    } else {
      setParseResult(result);
    }

    setStep('preview');
  }, [content, format]);

  const handleImport = useCallback(async () => {
    if (!parseResult || !targetList || !onImport) {
      return;
    }

    setStep('importing');
    setImportError(null);

    try {
      // Show progress during import
      await onImport(targetList, parseResult.data);
      setImportProgress(100);
      setStep('complete');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      setStep('preview');
    }
  }, [parseResult, targetList, onImport]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(handleReset, 300); // Reset after dialog closes
  }, [handleReset]);

  const renderSelectStep = () => (
    <div className="space-y-4">
      {/* Target List Selection */}
      <div className="space-y-2">
        <Label htmlFor="target-list">Target Address List</Label>
        <Input
          id="target-list"
          placeholder="Enter list name or create new"
          value={targetList}
          onChange={(e) => setTargetList(e.target.value)}
          list="existing-lists"
        />
        <datalist id="existing-lists">
          {existingLists.map((list) => (
            <option key={list} value={list} />
          ))}
        </datalist>
        <p className="text-sm text-muted-foreground">
          Entries will be added to this list. If the list doesn't exist, it will be created.
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <Label htmlFor="format">File Format</Label>
        <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
          <SelectTrigger id="format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="csv">CSV (IP,comment,timeout)</SelectItem>
            <SelectItem value="json">JSON (array of objects)</SelectItem>
            <SelectItem value="txt">TXT (one IP per line)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Upload / Drag-and-Drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.json,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Drop file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports CSV, JSON, and TXT files
          </p>
        </label>
      </div>

      {/* Text Area Paste */}
      <div className="space-y-2">
        <Label htmlFor="paste-content">Or paste content here</Label>
        <Textarea
          id="paste-content"
          placeholder="Paste IP addresses here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
      </div>

      {/* Format Examples */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-medium">Supported formats:</p>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>CSV: <code className="text-xs">192.168.1.1,My comment,1d</code></li>
            <li>JSON: <code className="text-xs">[{`{"address": "192.168.1.1", "comment": "..."}`}]</code></li>
            <li>TXT: One IP per line</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleParse}
          disabled={!content.trim() || !targetList.trim()}
        >
          Parse & Validate
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium">Valid Entries</span>
          </div>
          <p className="text-2xl font-bold">{parseResult?.data.length || 0}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-error" />
            <span className="font-medium">Errors</span>
          </div>
          <p className="text-2xl font-bold">{parseResult?.errors.length || 0}</p>
        </div>
      </div>

      {/* Error List (limit to first 100) */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Validation Errors</Label>
            {parseResult.errors.length > 100 && (
              <Badge variant="secondary">
                Showing first 100 of {parseResult.errors.length}
              </Badge>
            )}
          </div>
          <ScrollArea className="h-48 rounded-lg border p-4">
            <div className="space-y-2">
              {parseResult.errors.slice(0, 100).map((error, index) => (
                <div key={index} className="text-sm">
                  <span className="font-mono text-error">Line {error.line}:</span>{' '}
                  <span className="font-mono">{error.address}</span> - {error.message}
                </div>
              ))}
            </div>
          </ScrollArea>
          {parseResult.errors.length > 100 && (
            <p className="text-sm text-muted-foreground">
              Download full error report to see all {parseResult.errors.length} errors.
            </p>
          )}
        </div>
      )}

      {/* Preview of valid entries */}
      {parseResult && parseResult.data.length > 0 && (
        <div className="space-y-2">
          <Label>Preview (first 10 entries)</Label>
          <ScrollArea className="h-48 rounded-lg border p-4">
            <div className="space-y-2">
              {parseResult.data.slice(0, 10).map((entry, index) => (
                <div key={index} className="text-sm font-mono">
                  {entry.address}
                  {entry.comment && (
                    <span className="text-muted-foreground ml-2">// {entry.comment}</span>
                  )}
                  {entry.timeout && (
                    <Badge variant="secondary" className="ml-2">
                      {entry.timeout}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || parseResult.data.length === 0}
          >
            Import {parseResult?.data.length || 0} Entries
          </Button>
        </div>
      </div>
    </div>
  );

  const renderImportingStep = () => (
    <div className="space-y-4 py-8">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">Importing entries...</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Importing {parseResult?.data.length || 0} entries to {targetList}
        </p>
        <Progress value={importProgress} className="w-full" />
        <p className="text-sm text-muted-foreground mt-2">
          {importProgress.toFixed(0)}%
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4 py-8">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Successfully imported {parseResult?.data.length || 0} entries to {targetList}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={handleReset}>Import More</Button>
        <Button variant="default" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Import Address List</DialogTitle>
            {step !== 'select' && step !== 'importing' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4 mr-1" />
                Start Over
              </Button>
            )}
          </div>
          <DialogDescription>
            {step === 'select' && 'Upload a file or paste content to import address list entries'}
            {step === 'preview' && 'Review and validate entries before importing'}
            {step === 'importing' && 'Importing entries to the address list'}
            {step === 'complete' && 'Import completed successfully'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && renderSelectStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'complete' && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  );
}
