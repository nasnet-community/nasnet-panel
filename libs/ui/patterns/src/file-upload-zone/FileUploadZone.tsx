/**
 * File Upload Zone Component
 * Drag-and-drop file upload area matching Design Direction 1 (Clean Minimal)
 * Based on UX Design Specification - Component Library
 */

import * as React from 'react';

import { Upload, File, Loader2, AlertCircle } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

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
          'cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200',
          isDragOver && !disabled && !isLoading ?
            'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : error ? 'border-error bg-error/5 dark:bg-error/10'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
          (disabled || isLoading) && 'cursor-not-allowed opacity-50',
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
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
            isDragOver ? 'bg-primary-100 dark:bg-primary-900/40'
            : error ? 'bg-error/10 dark:bg-error/20'
            : 'bg-primary-50 dark:bg-primary-900/30'
          )}
        >
          {isLoading ?
            <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          : error ?
            <AlertCircle className="text-error h-8 w-8" />
          : isDragOver ?
            <Upload className="text-primary-500 h-8 w-8" />
          : <File className="text-primary-500 h-8 w-8" />}
        </div>

        {/* Text */}
        {isLoading ?
          <>
            <p className="mb-1 font-medium text-slate-900 dark:text-slate-50">Uploading...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please wait</p>
          </>
        : error ?
          <>
            <p className="text-error-dark dark:text-error-light mb-1 font-medium">Upload Failed</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{error}</p>
          </>
        : <>
            <p className="mb-1 font-medium text-slate-900 dark:text-slate-50">
              {isDragOver ?
                'Drop file here'
              : `Drop ${accept.length > 0 ? accept.join(', ') : ''} file here`}
            </p>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">or tap to browse</p>
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
        }
      </div>

      {/* Help text */}
      {!error && accept.length > 0 && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Accepted formats: {accept.join(', ')} · Max size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      )}
    </div>
  );
}
