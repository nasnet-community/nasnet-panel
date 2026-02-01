/**
 * CodeBlockCopy Component
 *
 * Displays code/config blocks with copy functionality.
 * Preserves formatting and comments when copying.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CodeBlockCopy code={firewallRule} />
 *
 * // With line numbers
 * <CodeBlockCopy code={script} showLineNumbers />
 *
 * // RouterOS config
 * <CodeBlockCopy code={config} language="routeros" title="Firewall Rule" />
 * ```
 *
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import * as React from 'react';

import { Copy, Check } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { useClipboard } from '../hooks';
import { useToast } from '../hooks/useToast';

/**
 * Supported syntax languages for styling hints
 */
export type CodeBlockLanguage =
  | 'routeros'   // MikroTik RouterOS script
  | 'json'       // JSON configuration
  | 'yaml'       // YAML configuration
  | 'shell'      // Shell/bash script
  | 'text';      // Plain text

/**
 * Props for CodeBlockCopy component
 */
export interface CodeBlockCopyProps {
  /**
   * The code/configuration to display
   */
  code: string;

  /**
   * Language for syntax hints (does not enable full highlighting)
   * @default 'text'
   */
  language?: CodeBlockLanguage;

  /**
   * Title to display above the code block
   */
  title?: string;

  /**
   * Show line numbers
   * @default false
   */
  showLineNumbers?: boolean;

  /**
   * Maximum height with scroll
   */
  maxHeight?: number | string;

  /**
   * Show toast notification on copy
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast title
   * @default 'Copied!'
   */
  toastTitle?: string;

  /**
   * Custom toast description
   */
  toastDescription?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the code element
   */
  codeClassName?: string;

  /**
   * Callback fired on successful copy
   */
  onCopy?: (code: string) => void;
}

/**
 * Get language label for display
 */
function getLanguageLabel(language: CodeBlockLanguage): string {
  switch (language) {
    case 'routeros':
      return 'RouterOS';
    case 'json':
      return 'JSON';
    case 'yaml':
      return 'YAML';
    case 'shell':
      return 'Shell';
    default:
      return '';
  }
}

/**
 * CodeBlockCopy Component
 *
 * Displays code/config blocks with a copy button in the top-right corner.
 * Preserves all formatting including whitespace and comments.
 */
export function CodeBlockCopy({
  code,
  language = 'text',
  title,
  showLineNumbers = false,
  maxHeight,
  showToast: showToastProp = true,
  toastTitle = 'Copied!',
  toastDescription,
  className,
  codeClassName,
  onCopy,
}: CodeBlockCopyProps) {
  const { toast } = useToast();
  const { copy, copied } = useClipboard({
    onSuccess: (val) => {
      onCopy?.(val);
      if (showToastProp) {
        toast({
          title: toastTitle,
          description: toastDescription ?? 'Code copied to clipboard',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    },
  });

  const handleCopy = async () => {
    await copy(code);
  };

  // Split code into lines for line numbers
  const lines = code.split('\n');
  const lineNumberWidth = String(lines.length).length;

  // Determine max height style
  const maxHeightStyle = maxHeight
    ? typeof maxHeight === 'number'
      ? { maxHeight: `${maxHeight}px` }
      : { maxHeight }
    : undefined;

  const languageLabel = getLanguageLabel(language);

  return (
    <div
      className={cn(
        'relative rounded-card-sm overflow-hidden',
        'bg-slate-100 dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        className
      )}
    >
      {/* Header with title, language label, and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-200/50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {title}
            </span>
          )}
          {languageLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-300/50 dark:bg-slate-600/50 text-slate-600 dark:text-slate-400">
              {languageLabel}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-button hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1.5 text-success" />
              <span className="text-xs font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1.5 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code block */}
      <div
        className="overflow-auto"
        style={maxHeightStyle}
      >
        <pre className="p-4 m-0">
          <code
            className={cn(
              'block font-mono text-sm text-slate-900 dark:text-slate-50',
              'whitespace-pre',
              codeClassName
            )}
          >
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="hover:bg-slate-200/30 dark:hover:bg-slate-700/30">
                      <td
                        className="pr-4 text-right select-none text-slate-400 dark:text-slate-500"
                        style={{ width: `${lineNumberWidth + 1}ch` }}
                      >
                        {index + 1}
                      </td>
                      <td className="pl-4 border-l border-slate-300 dark:border-slate-600">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

CodeBlockCopy.displayName = 'CodeBlockCopy';
