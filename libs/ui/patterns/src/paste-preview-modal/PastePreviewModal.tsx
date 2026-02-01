/**
 * PastePreviewModal Component
 *
 * Modal for previewing and validating pasted import data.
 * Shows parsed items and validation errors before applying.
 *
 * @example
 * ```tsx
 * <PastePreviewModal
 *   open={showPreview}
 *   parseResult={result}
 *   onApply={handleApply}
 *   onCancel={() => setShowPreview(false)}
 * />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import * as React from 'react';

import { Check, X, AlertTriangle, FileText, List, Terminal } from 'lucide-react';

import {
  cn,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Badge,
} from '@nasnet/ui/primitives';

import type { ParseResult, ImportType } from '../hooks/usePasteImport';

/**
 * Props for PastePreviewModal component
 */
export interface PastePreviewModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Parse result to display
   */
  parseResult: ParseResult | null;

  /**
   * Title for the modal
   * @default 'Import Preview'
   */
  title?: string;

  /**
   * Maximum height for the preview content
   * @default 400
   */
  maxPreviewHeight?: number;

  /**
   * Callback when apply is clicked
   */
  onApply: (result: ParseResult) => void;

  /**
   * Callback when cancel is clicked
   */
  onCancel: () => void;

  /**
   * Whether apply is disabled (e.g., when there are errors)
   * @default false (auto-determined by errors)
   */
  applyDisabled?: boolean;

  /**
   * Allow applying even with errors
   * @default false
   */
  allowApplyWithErrors?: boolean;

  /**
   * Custom apply button text
   * @default 'Apply'
   */
  applyText?: string;

  /**
   * Custom cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;
}

/**
 * Get icon for import type
 */
function getTypeIcon(type: ImportType) {
  switch (type) {
    case 'ip-list':
      return <List className="h-4 w-4" />;
    case 'csv':
      return <FileText className="h-4 w-4" />;
    case 'routeros':
      return <Terminal className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

/**
 * Get label for import type
 */
function getTypeLabel(type: ImportType): string {
  switch (type) {
    case 'ip-list':
      return 'IP Address List';
    case 'csv':
      return 'CSV Data';
    case 'routeros':
      return 'RouterOS Configuration';
    default:
      return 'Text Data';
  }
}

/**
 * PastePreviewModal Component
 *
 * Shows a preview of parsed import data with validation errors.
 * Allows user to review before applying.
 */
export function PastePreviewModal({
  open,
  parseResult,
  title = 'Import Preview',
  maxPreviewHeight = 400,
  onApply,
  onCancel,
  applyDisabled,
  allowApplyWithErrors = false,
  applyText = 'Apply',
  cancelText = 'Cancel',
}: PastePreviewModalProps) {
  if (!parseResult) return null;

  const hasErrors = parseResult.errors.length > 0;
  const isApplyDisabled = applyDisabled ?? (hasErrors && !allowApplyWithErrors);

  const handleApply = () => {
    onApply(parseResult);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(parseResult.type)}
            {title}
          </DialogTitle>
          <DialogDescription>
            Review the imported data before applying changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="rounded-full">
                {getTypeLabel(parseResult.type)}
              </Badge>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {parseResult.totalLines} lines processed
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Check className="h-4 w-4 text-success" />
                <span className="text-success font-medium">{parseResult.items.length} valid</span>
              </div>
              {hasErrors && (
                <div className="flex items-center gap-1.5 text-sm">
                  <X className="h-4 w-4 text-error" />
                  <span className="text-error font-medium">{parseResult.errors.length} errors</span>
                </div>
              )}
            </div>
          </div>

          {/* Errors section */}
          {hasErrors && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-error">
                <AlertTriangle className="h-4 w-4" />
                Validation Errors
              </div>
              <div
                className="bg-error/5 border border-error/20 rounded-lg overflow-auto"
                style={{ maxHeight: Math.min(150, maxPreviewHeight / 3) }}
              >
                <table className="w-full text-sm">
                  <thead className="bg-error/10">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-error w-16">Line</th>
                      <th className="text-left px-3 py-2 font-medium text-error">Error</th>
                      <th className="text-left px-3 py-2 font-medium text-error">Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-error/10">
                    {parseResult.errors.map((error, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-mono text-error">{error.line}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{error.message}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {error.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid items preview */}
          {parseResult.items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Check className="h-4 w-4 text-success" />
                Valid Items ({parseResult.items.length})
              </div>
              <div
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-auto"
                style={{ maxHeight: maxPreviewHeight - (hasErrors ? 200 : 50) }}
              >
                {parseResult.type === 'csv' && typeof parseResult.items[0]?.value === 'object' ? (
                  // CSV table view
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-400 w-12">#</th>
                        {Object.keys(parseResult.items[0].value as Record<string, string>).map((key) => (
                          <th key={key} className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-400">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {parseResult.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-700/30">
                          <td className="px-3 py-2 font-mono text-slate-400">{item.line}</td>
                          {Object.values(item.value as Record<string, string>).map((val, vidx) => (
                            <td key={vidx} className="px-3 py-2 font-mono text-slate-900 dark:text-slate-50">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // List view for IP list and RouterOS
                  <div className="font-mono text-sm">
                    {parseResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2',
                          'border-b border-slate-200 dark:border-slate-700 last:border-b-0',
                          'hover:bg-slate-100 dark:hover:bg-slate-700/30'
                        )}
                      >
                        <span className="text-slate-400 w-8 text-right">{item.line}</span>
                        <span className="text-slate-900 dark:text-slate-50">
                          {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {parseResult.items.length === 0 && !hasErrors && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No items found in the pasted content.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplyDisabled || parseResult.items.length === 0}
          >
            {applyText}
            {parseResult.items.length > 0 && (
              <span className="ml-1">({parseResult.items.length})</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

PastePreviewModal.displayName = 'PastePreviewModal';
