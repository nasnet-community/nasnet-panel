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

import { memo, useMemo, useCallback } from 'react';

import { Check, Copy } from 'lucide-react';
import { cn, Button, Icon } from '@nasnet/ui/primitives';

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
 * Displays code/configuration blocks with copy-to-clipboard functionality
 */
export interface CodeBlockCopyProps {
  /**
   * The code/configuration to display
   * Preserves all whitespace and formatting
   */
  code: string;

  /**
   * Language for syntax hints (does not enable full highlighting)
   * Used for display badge and styling hints
   * @default 'text'
   */
  language?: CodeBlockLanguage;

  /**
   * Title to display above the code block
   * Optional header text to identify the code content
   */
  title?: string;

  /**
   * Show line numbers alongside code
   * Useful for long scripts or configuration blocks
   * @default false
   */
  showLineNumbers?: boolean;

  /**
   * Maximum height with vertical scroll
   * Can be a pixel value (number) or CSS length (string like '300px', '50vh')
   */
  maxHeight?: number | string;

  /**
   * Show toast notification on successful copy
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast title shown on copy success
   * @default 'Copied!'
   */
  toastTitle?: string;

  /**
   * Custom toast description shown on copy success
   */
  toastDescription?: string;

  /**
   * Additional CSS classes for the outer container
   * Use for layout/spacing customization
   */
  className?: string;

  /**
   * Additional CSS classes for the code element
   * Use for font, color, or text styling
   */
  codeClassName?: string;

  /**
   * Callback fired on successful copy
   * Called after code is copied to clipboard
   * @param code The code that was copied
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
function CodeBlockCopyComponent({
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

  const handleCopy = useCallback(async () => {
    await copy(code);
  }, [copy, code]);

  // Memoize computed values for performance
  const { lines, lineNumberWidth, maxHeightStyle, languageLabel } = useMemo(() => {
    const codeLines = code.split('\n');
    const numberWidth = String(codeLines.length).length;
    const heightStyle = maxHeight
      ? typeof maxHeight === 'number'
        ? { maxHeight: `${maxHeight}px` }
        : { maxHeight }
      : undefined;
    const label = getLanguageLabel(language);
    return {
      lines: codeLines,
      lineNumberWidth: numberWidth,
      maxHeightStyle: heightStyle,
      languageLabel: label,
    };
  }, [code, maxHeight, language]);

  return (
    <div
      className={cn(
        'relative rounded-card-sm overflow-hidden',
        'bg-muted',
        'border border-border',
        className
      )}
    >
      {/* Header with title, language label, and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-sm font-medium text-foreground">
              {title}
            </span>
          )}
          {languageLabel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">
              {languageLabel}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 rounded-button hover:bg-muted/80 transition-colors"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Icon icon={Check} size="sm" className="mr-1.5 text-success" />
              <span className="text-xs font-medium">Copied</span>
            </>
          ) : (
            <>
              <Icon icon={Copy} size="sm" className="mr-1.5 text-muted-foreground" />
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
              'block font-mono text-sm text-foreground',
              'whitespace-pre',
              codeClassName
            )}
          >
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="hover:bg-muted/40">
                      <td
                        className="pr-4 text-right select-none text-muted-foreground"
                        style={{ width: `${lineNumberWidth + 1}ch` }}
                      >
                        {index + 1}
                      </td>
                      <td className="pl-4 border-l border-border">
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

CodeBlockCopyComponent.displayName = 'CodeBlockCopy';

export const CodeBlockCopy = memo(CodeBlockCopyComponent);
