/**
 * Configuration Input Component
 * File upload zone with paste support for importing router configurations
 * Implements FileUploadZone pattern from design spec section 6.3
 */

import { useState, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import { Upload, FileText, Clipboard, X, ExternalLink } from 'lucide-react';

export interface ConfigurationInputProps {
  /**
   * Current configuration content
   */
  value: string;

  /**
   * Callback when configuration changes
   */
  onChange: (value: string) => void;

  /**
   * Whether input is disabled
   */
  disabled?: boolean;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Optional className for styling
   */
  className?: string;
}

type InputMode = 'upload' | 'paste';

/**
 * ConfigurationInput Component
 *
 * Allows users to input configuration via:
 * - Drag and drop .rsc files
 * - File browser selection
 * - Text paste/manual entry
 *
 * @example
 * ```tsx
 * <ConfigurationInput
 *   value={config}
 *   onChange={setConfig}
 * />
 * ```
 */
export const ConfigurationInput = memo(function ConfigurationInput({
  value,
  onChange,
  disabled = false,
  error,
  className,
}: ConfigurationInputProps) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize character count
  const charCount = useMemo(() => value.length, [value.length]);

  /**
   * Handles file selection from input or drop
   */
  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Validate file type
      const validExtensions = ['.rsc', '.txt', '.conf'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        // Still allow the file, just warn
        console.warn('Unexpected file extension:', fileExtension);
      }

      try {
        const content = await file.text();
        onChange(content);
        setFileName(file.name);
        setMode('paste'); // Switch to paste view to show content
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    },
    [disabled, onChange]
  );

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handles file drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  /**
   * Handles file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  /**
   * Opens file browser
   */
  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  /**
   * Clears the current configuration
   */
  const handleClear = useCallback(() => {
    onChange('');
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  /**
   * Pastes from clipboard
   */
  const handlePasteFromClipboard = useCallback(async () => {
    if (disabled) return;
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
      setFileName(null);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  }, [disabled, onChange]);

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* External Link */}
      <div className="gap-component-sm p-component-md bg-secondary/10 border-border flex items-center rounded-lg border">
        <ExternalLink
          className="text-secondary h-4 w-4 flex-shrink-0"
          aria-hidden="true"
        />
        <p className="text-foreground text-sm">
          Get your configuration from{' '}
          <a
            href="https://connect.starlink4iran.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary focus-visible:ring-ring rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            NASNET Connect
          </a>
        </p>
      </div>

      {/* Mode Tabs */}
      <div
        className="gap-component-sm p-component-sm bg-muted flex rounded-lg"
        role="tablist"
        aria-label="Configuration input method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'upload'}
          aria-controls="panel-upload"
          onClick={() => setMode('upload')}
          disabled={disabled}
          className={`gap-component-sm px-component-sm py-component-sm focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            mode === 'upload' ?
              'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Upload
            className="h-4 w-4"
            aria-hidden="true"
          />
          Upload File
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          aria-controls="panel-paste"
          onClick={() => setMode('paste')}
          disabled={disabled}
          className={`gap-component-sm px-component-sm py-component-sm focus-visible:ring-ring flex min-h-[44px] flex-1 items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            mode === 'paste' ?
              'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Clipboard
            className="h-4 w-4"
            aria-hidden="true"
          />
          Paste Config
        </button>
      </div>

      {/* Input Area */}
      <AnimatePresence mode="wait">
        {mode === 'upload' ?
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".rsc,.txt,.conf"
              onChange={handleFileInputChange}
              disabled={disabled}
              className="hidden"
            />

            {/* Drop Zone */}
            <div
              id="panel-upload"
              role="tabpanel"
              aria-label="Upload configuration file"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBrowseClick();
                }
              }}
              tabIndex={0}
              className={`p-component-xl focus-visible:ring-ring relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDragOver ?
                  'border-primary bg-primary/5'
                : 'border-border hover:border-primary/60 hover:bg-muted/50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${error ? 'border-error' : ''} `}
            >
              <div className="flex flex-col items-center text-center">
                {fileName ?
                  <>
                    <div className="bg-success/10 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                      <FileText
                        className="text-success h-6 w-6"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-foreground text-sm font-medium">{fileName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Click to replace or drop a new file
                    </p>
                  </>
                : <>
                    <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                      <Upload
                        className="text-muted-foreground h-6 w-6"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-foreground text-sm font-medium">Drop .rsc file here</p>
                    <p className="text-muted-foreground mt-1 text-xs">or click to browse</p>
                  </>
                }
              </div>

              {/* Drag overlay */}
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary/10 absolute inset-0 flex items-center justify-center rounded-xl"
                >
                  <p className="text-primary font-medium">Drop to upload</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        : <motion.div
            key="paste"
            id="panel-paste"
            role="tabpanel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {/* Paste button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                disabled={disabled}
                aria-label="Paste configuration from clipboard"
                className="gap-component-sm px-component-sm py-component-sm text-secondary hover:bg-secondary/10 focus-visible:ring-ring flex min-h-[44px] items-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <Clipboard
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Paste from clipboard
              </button>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                aria-label="Router configuration content"
                placeholder="Paste your RouterOS configuration here..."
                className={`p-component-md bg-muted placeholder:text-muted-foreground focus-visible:ring-ring h-48 w-full resize-none rounded-xl border font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${error ? 'border-error' : 'border-border'} ${disabled ? 'cursor-not-allowed opacity-50' : ''} `}
              />

              {/* Clear button */}
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear configuration content"
                  className="p-component-sm text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {/* Character count */}
            <div className="flex justify-end">
              <span
                className="text-muted-foreground font-mono text-xs"
                role="status"
              >
                {charCount.toLocaleString()} characters
              </span>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p
          className="text-error gap-component-sm flex items-center text-sm"
          role="alert"
        >
          <span
            className="bg-error h-1 w-1 rounded-full"
            aria-hidden="true"
          />
          {error}
        </p>
      )}

      {/* File name indicator */}
      {fileName && mode === 'paste' && (
        <p className="text-muted-foreground gap-component-sm flex items-center text-xs">
          <FileText
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
          Loaded from: {fileName}
        </p>
      )}
    </div>
  );
});

ConfigurationInput.displayName = 'ConfigurationInput';
