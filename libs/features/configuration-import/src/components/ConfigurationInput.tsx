/**
 * Configuration Input Component
 * File upload zone with paste support for importing router configurations
 * Implements FileUploadZone pattern from design spec section 6.3
 */

import { useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}: ConfigurationInputProps) {
  const [mode, setMode] = useState<InputMode>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-4">
      {/* External Link */}
      <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-border">
        <ExternalLink className="w-4 h-4 text-secondary flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-foreground">
          Get your configuration from{' '}
          <a
            href="https://connect.starlink4iran.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            NASNET Connect
          </a>
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg" role="tablist" aria-label="Configuration input method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'upload'}
          aria-controls="panel-upload"
          onClick={() => setMode('upload')}
          disabled={disabled}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            mode === 'upload'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          Upload File
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          aria-controls="panel-paste"
          onClick={() => setMode('paste')}
          disabled={disabled}
          className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            mode === 'paste'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Clipboard className="w-4 h-4" aria-hidden="true" />
          Paste Config
        </button>
      </div>

      {/* Input Area */}
      <AnimatePresence mode="wait">
        {mode === 'upload' ? (
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
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBrowseClick(); } }}
              tabIndex={0}
              className={`
                relative p-8 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 hover:bg-muted/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${error ? 'border-destructive' : ''}
              `}
            >
              <div className="flex flex-col items-center text-center">
                {fileName ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-success" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to replace or drop a new file
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Drop .rsc file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </>
                )}
              </div>

              {/* Drag overlay */}
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl"
                >
                  <p className="text-primary font-medium">
                    Drop to upload
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
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
                className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Clipboard className="w-3.5 h-3.5" aria-hidden="true" />
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
                className={`
                  w-full h-48 p-4 font-mono text-sm
                  bg-muted
                  border rounded-xl resize-none
                  placeholder:text-muted-foreground
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  ${error ? 'border-destructive' : 'border-border'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />

              {/* Clear button */}
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear configuration content"
                  className="absolute top-2 right-2 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Character count */}
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {value.length.toLocaleString()} characters
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5" role="alert">
          <span className="w-1 h-1 rounded-full bg-destructive" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* File name indicator */}
      {fileName && mode === 'paste' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          Loaded from: {fileName}
        </p>
      )}
    </div>
  );
});

