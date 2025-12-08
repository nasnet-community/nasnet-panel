/**
 * File Upload Zone Component
 * Drag-and-drop file upload area matching Design Direction 1 (Clean Minimal)
 * Based on UX Design Specification - Component Library
 */

import * as React from 'react';
import { cn, Button } from '@nasnet/ui/primitives';
import { Upload, File, Loader2, AlertCircle } from 'lucide-react';

/**
 * FileUploadZone Props
 */
export interface FileUploadZoneProps {
  /** Accepted file extensions (e.g., ['.conf', '.json']) */
  accept?: string[];
  /** File selection callback */
  onFile: (file: File) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * FileUploadZone Component
 * Provides drag-and-drop and click-to-browse file upload
 * 
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - File type validation
 * - Size validation
 * - Loading state
 * - Error state
 * - Highlight on drag over
 * 
 * @example
 * ```tsx
 * <FileUploadZone
 *   accept={['.conf']}
 *   onFile={(file) => uploadConfig(file)}
 *   isLoading={uploading}
 * />
 * ```
 */
export function FileUploadZone({
  accept = [],
  onFile,
  isLoading = false,
  error,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFile = (file: File) => {
    // Validate file type
    if (accept.length > 0) {
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!accept.includes(fileExt)) {
        return;
      }
    }

    // Validate file size
    if (file.size > maxSize) {
      return;
    }

    onFile(file);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  const acceptString = accept.join(',');

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragOver && !disabled && !isLoading
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : error
            ? 'border-error bg-error/5 dark:bg-error/10'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          !disabled && !isLoading && !error && 'hover:border-slate-300 dark:hover:border-slate-600'
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isLoading}
          aria-label="File upload input"
        />

        {/* Icon */}
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors',
            isDragOver
              ? 'bg-primary-100 dark:bg-primary-900/40'
              : error
              ? 'bg-error/10 dark:bg-error/20'
              : 'bg-primary-50 dark:bg-primary-900/30'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-8 h-8 text-error" />
          ) : isDragOver ? (
            <Upload className="w-8 h-8 text-primary-500" />
          ) : (
            <File className="w-8 h-8 text-primary-500" />
          )}
        </div>

        {/* Text */}
        {isLoading ? (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">
              Uploading...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please wait
            </p>
          </>
        ) : error ? (
          <>
            <p className="font-medium text-error-dark dark:text-error-light mb-1">
              Upload Failed
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {error}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">
              {isDragOver ? 'Drop file here' : `Drop ${accept.length > 0 ? accept.join(', ') : ''} file here`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              or tap to browse
            </p>
            <Button
              variant="action"
              size="default"
              disabled={disabled || isLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="pointer-events-none"
            >
              Select File
            </Button>
          </>
        )}
      </div>

      {/* Help text */}
      {!error && accept.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Accepted formats: {accept.join(', ')} · Max size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      )}
    </div>
  );
}

