/**
 * AddressListExportDialog Component
 * @description Export address list entries in CSV, JSON, or RouterOS script (.rsc) formats
 * Allows users to choose format, preview content, and download or copy to clipboard
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Download, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { Icon } from '@nasnet/ui/primitives/icon';
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
import { RadioGroup, RadioGroupItem } from '@nasnet/ui/primitives/radio-group';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Badge } from '@nasnet/ui/primitives/badge';
import { ScrollArea } from '@nasnet/ui/primitives/scroll-area';
import {
  formatAddressList,
  downloadFile,
  copyToClipboard,
  generateFilename,
  estimateSize,
  type ExportFormat,
  type AddressListEntry,
} from '../utils/addressListFormatters';

export interface AddressListExportDialogProps {
  /** List name to export (used in filename and list parameter) */
  listName: string;
  /** Entries to export */
  entries: AddressListEntry[];
  /** Optional trigger button text (default: "Export") */
  triggerText?: string;
  /** Optional CSS class names to apply */
  className?: string;
}

/**
 * AddressListExportDialog Component
 * @description Modal dialog for exporting address list entries in multiple formats
 * Features:
 * - Format selection (CSV, JSON, RouterOS script)
 * - Content preview with truncation for large files
 * - Download and copy-to-clipboard actions
 * - File size estimation
 *
 * @example
 * ```tsx
 * <AddressListExportDialog
 *   listName="blocklist"
 *   entries={entries}
 *   triggerText="Export"
 * />
 * ```
 *
 * @param props - Component props
 * @returns Export dialog with trigger button
 */
export const AddressListExportDialog = memo(function AddressListExportDialog({
  listName,
  entries,
  triggerText = 'Export',
  className,
}: AddressListExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [preview, setPreview] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const PREVIEW_MAX_CHARS = 1000;
  const COPY_SUCCESS_DURATION = 3000;

  // Generate preview when format changes
  const handleFormatChange = useCallback(
    (newFormat: ExportFormat) => {
      setFormat(newFormat);
      const formatted = formatAddressList(entries, newFormat, listName);
      // Limit preview to first N characters for performance
      setPreview(
        formatted.length > PREVIEW_MAX_CHARS
          ? formatted.slice(0, PREVIEW_MAX_CHARS) + '\n...'
          : formatted
      );
      setCopySuccess(false);
    },
    [entries, listName]
  );

  // Initialize preview on open
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen && !preview) {
        handleFormatChange(format);
      }
    },
    [format, preview, handleFormatChange]
  );

  const handleDownload = useCallback(() => {
    const content = formatAddressList(entries, format, listName);
    const filename = generateFilename(listName, format);
    downloadFile(content, filename, format);
  }, [entries, format, listName]);

  const handleCopy = useCallback(async () => {
    const content = formatAddressList(entries, format, listName);
    const success = await copyToClipboard(content);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), COPY_SUCCESS_DURATION);
    }
  }, [entries, format, listName]);

  const estimatedSize = useMemo(
    () => estimateSize(entries, format, listName),
    [entries, format, listName]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Icon icon={Download} size={16} className="mr-2" label="" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Address List</DialogTitle>
          <DialogDescription>
            Export {entries.length} entries from {listName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={handleFormatChange}>
              <div className="space-y-2">
                {/* CSV Format */}
                <div className={cn('flex items-start space-x-2 rounded-lg border p-4 hover:bg-accent transition-colors')}>
                  <RadioGroupItem value="csv" id="format-csv" className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor="format-csv" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon icon={FileText} size={16} />
                        <span className="font-medium">CSV</span>
                        <Badge variant="secondary">Spreadsheet</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comma-separated values with header row (IP, Comment, Timeout)
                      </p>
                      <code className="text-xs text-muted-foreground mt-2 block font-mono">
                        192.168.1.1,"My comment",1d
                      </code>
                    </label>
                  </div>
                </div>

                {/* JSON Format */}
                <div className={cn('flex items-start space-x-2 rounded-lg border p-4 hover:bg-accent transition-colors')}>
                  <RadioGroupItem value="json" id="format-json" className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor="format-json" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon icon={FileText} size={16} />
                        <span className="font-medium">JSON</span>
                        <Badge variant="secondary">API-friendly</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        JSON array of objects with address, comment, and timeout
                      </p>
                      <code className="text-xs text-muted-foreground mt-2 block font-mono">
                        [{`{"address": "192.168.1.1", "comment": "..."}`}]
                      </code>
                    </label>
                  </div>
                </div>

                {/* RouterOS Script Format */}
                <div className={cn('flex items-start space-x-2 rounded-lg border p-4 hover:bg-accent transition-colors')}>
                  <RadioGroupItem value="routeros" id="format-routeros" className="mt-1" />
                  <div className="flex-1">
                    <label htmlFor="format-routeros" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon icon={FileText} size={16} />
                        <span className="font-medium">RouterOS Script</span>
                        <Badge variant="secondary">.rsc</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        MikroTik script file with add commands for direct import
                      </p>
                      <code className="text-xs text-muted-foreground mt-2 block font-mono">
                        /ip firewall address-list add list="..." address=...
                      </code>
                    </label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* File Info */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Estimated Size</p>
                <p className="text-xs text-muted-foreground">{estimatedSize}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Entries</p>
                <p className="text-xs text-muted-foreground">{entries.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Filename</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {generateFilename(listName, format)}.{format === 'routeros' ? 'rsc' : format}
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <ScrollArea className="h-64 rounded-lg border p-4 bg-muted/30">
              <pre className="text-xs font-mono whitespace-pre-wrap">{preview}</pre>
            </ScrollArea>
            {preview.includes('...') && (
              <p className="text-xs text-muted-foreground">
                Preview truncated. Full content will be exported.
              </p>
            )}
          </div>

          {/* RouterOS Script Help */}
          {format === 'routeros' && (
            <Alert>
              <Icon icon={FileText} size={16} />
              <AlertDescription>
                <p className="font-medium mb-1">How to use RouterOS script:</p>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Download the .rsc file</li>
                  <li>Upload to router via Files menu</li>
                  <li>Run: <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">/import file-name=filename.rsc</code></li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={copySuccess}
                aria-label={copySuccess ? 'Copied to clipboard' : 'Copy to clipboard'}
              >
                {copySuccess ? (
                  <>
                    <Icon icon={CheckCircle2} size={16} className="mr-2 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon icon={Copy} size={16} className="mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownload}
                aria-label={`Download ${format} file`}
              >
                <Icon icon={Download} size={16} className="mr-2" />
                Download File
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AddressListExportDialog.displayName = 'AddressListExportDialog';
