/**
 * Configuration Input Component
 * File upload zone with paste support for importing router configurations
 * Implements FileUploadZone pattern from design spec section 6.3
 */

import { useState, useRef, useCallback } from 'react';
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
export function ConfigurationInput({
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
      <div className="flex items-center gap-2 p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <ExternalLink className="w-4 h-4 text-secondary-500 flex-shrink-0" />
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Get your configuration from{' '}
          <a
            href="https://connect.starlink4iran.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-600 dark:text-secondary-400 hover:underline font-medium"
          >
            NASNET Connect
          </a>
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('upload')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'upload'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('paste')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'paste'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Clipboard className="w-4 h-4" />
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              className={`
                relative p-8 border-2 border-dashed rounded-xl cursor-pointer
                transition-all duration-200
                ${
                  isDragOver
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${error ? 'border-error' : ''}
              `}
            >
              <div className="flex flex-col items-center text-center">
                {fileName ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-success-light dark:bg-success/20 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-success" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Click to replace or drop a new file
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Drop .rsc file here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                  className="absolute inset-0 flex items-center justify-center bg-primary-50/90 dark:bg-primary-900/90 rounded-xl"
                >
                  <p className="text-primary-600 dark:text-primary-400 font-medium">
                    Drop to upload
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="paste"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded-md transition-colors disabled:opacity-50"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste from clipboard
              </button>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Paste your RouterOS configuration here..."
                className={`
                  w-full h-48 p-4 font-mono text-sm
                  bg-slate-50 dark:bg-slate-900 
                  border rounded-xl resize-none
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${error ? 'border-error' : 'border-slate-200 dark:border-slate-700'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />

              {/* Clear button */}
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Character count */}
            <div className="flex justify-end">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {value.length.toLocaleString()} characters
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="text-sm text-error flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-error" />
          {error}
        </p>
      )}

      {/* File name indicator */}
      {fileName && mode === 'paste' && (
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Loaded from: {fileName}
        </p>
      )}
    </div>
  );
}

